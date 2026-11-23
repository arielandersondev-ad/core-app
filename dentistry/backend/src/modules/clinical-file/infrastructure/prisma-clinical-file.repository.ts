import { Injectable } from '@nestjs/common';
import { and, or } from '@prisma/orm-postgres/orm-client';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import { db } from '../../../prisma/db.js';
import { PlanLimitReachedException } from '../../auth/application/contracts/plan-limit-reached.exception.js';
import type { ClinicalFile } from '../domain/entities/clinical-file.entity.js';
import {
  ClinicalFileRepository,
  type ClinicalFileQuota,
  type ClinicalFileReservation,
  type ClinicalFileDetailsChange,
  type ClinicalFileScope,
  type ClinicalFileUsage,
  type EncounterReference,
  type FindClinicalFilesFilters,
} from '../domain/repositories/clinical-file.repository.js';
import { toClinicalFileEntity } from './clinical-file.mapper.js';

type OrmClient = Pick<TransactionContext, 'orm'>;

/**
 * Ocupan cupo los archivos READY y las reservas PENDING vigentes no eliminadas;
 * las reservas vencidas o FAILED no cuentan (target-schema-dictionary §5.6).
 */
function occupying(client: OrmClient, organizationId: string, now: Date) {
  return client.orm.dentistry.ClinicalFile.where({
    organizationId,
    deletedAt: null,
  }).where((file) =>
    or(
      file.uploadStatus.eq('READY'),
      and(file.uploadStatus.eq('PENDING'), file.uploadExpiresAt.gt(now)),
    ),
  );
}

async function usedBytes(client: OrmClient, organizationId: string, now: Date) {
  const { total } = await occupying(client, organizationId, now).aggregate(
    (aggregate) => ({ total: aggregate.sum('sizeBytes') }),
  );
  return Number(total ?? 0);
}

@Injectable()
export class PrismaClinicalFileRepository extends ClinicalFileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async reserve(
    data: ClinicalFileReservation,
    quota: ClinicalFileQuota,
    now: Date,
  ): Promise<ClinicalFile> {
    const row = await this.prisma.transaction(async (tx) => {
      // Serializa las reservas de la organización: sin el bloqueo, dos
      // subidas simultáneas leerían el mismo uso y ambas pasarían el cupo.
      const lockKey = `dentistry:clinical-files:${data.organizationId}`;
      await tx.execute(
        db.raw.sql`SELECT pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))::text AS locked`
          .returnsRow({ locked: 'pg/text@1' })
          .build(),
      );

      const { count } = await occupying(tx, data.organizationId, now)
        .where({ patientId: data.patientId })
        .aggregate((aggregate) => ({ count: aggregate.count() }));
      if (count >= quota.filesPerPatient) {
        throw new PlanLimitReachedException('filesPerPatient', quota.filesPerPatient);
      }
      if (
        (await usedBytes(tx, data.organizationId, now)) + data.sizeBytes >
        quota.fileStorageBytes
      ) {
        throw new PlanLimitReachedException('fileStorageBytes', quota.fileStorageBytes);
      }

      return tx.orm.dentistry.ClinicalFile.create({
        ...data,
        uploadStatus: 'PENDING',
      });
    });
    return toClinicalFileEntity(row);
  }

  async findById(scope: ClinicalFileScope, id: string): Promise<ClinicalFile | null> {
    const row = await this.prisma.orm.dentistry.ClinicalFile.first({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      deletedAt: null,
    });
    return row ? toClinicalFileEntity(row) : null;
  }

  async findPage(
    filters: FindClinicalFilesFilters,
  ): Promise<PaginatedResult<ClinicalFile>> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
    let query = this.prisma.orm.dentistry.ClinicalFile.where({
      organizationId: filters.organizationId,
      patientId: filters.patientId,
      uploadStatus: 'READY',
      deletedAt: null,
    });
    if (filters.clinicalEncounterId) {
      query = query.where({ clinicalEncounterId: filters.clinicalEncounterId });
    }
    if (filters.category) query = query.where({ category: filters.category });

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));
    const rows = await query
      .orderBy([(file) => file.uploadedAt.desc(), (file) => file.id.desc()])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .all();
    return createPaginatedResult(
      rows.map(toClinicalFileEntity),
      { page, pageSize, limit: pageSize },
      totalItems,
    );
  }

  async markReady(
    scope: ClinicalFileScope,
    id: string,
    change: { checksumSha256: string; uploadedAt: Date; actorMembershipId: string },
  ): Promise<ClinicalFile | null> {
    const row = await this.prisma.transaction(async (tx) => {
      const updated = await tx.orm.dentistry.ClinicalFile.where({
        id,
        organizationId: scope.organizationId,
        patientId: scope.patientId,
        uploadStatus: 'PENDING',
        deletedAt: null,
      }).update({
        uploadStatus: 'READY',
        uploadedAt: change.uploadedAt,
        uploadExpiresAt: null,
        checksumSha256: change.checksumSha256,
      });
      if (!updated) return null;
      await writeAuditLog(tx, {
        organizationId: scope.organizationId,
        actorMembershipId: change.actorMembershipId,
        action: 'CLINICAL_FILE_UPLOADED',
        resource: 'ClinicalFile',
        resourceId: id,
        metadata: {
          patientId: scope.patientId,
          category: updated.category,
          mimeType: updated.mimeType,
          sizeBytes: updated.sizeBytes,
        },
      });
      return updated;
    });
    return row ? toClinicalFileEntity(row) : null;
  }

  async updateDetails(
    scope: ClinicalFileScope,
    id: string,
    change: ClinicalFileDetailsChange,
    expectedUpdatedAt: Date,
    actorMembershipId: string,
  ): Promise<ClinicalFile | null> {
    const row = await this.prisma.transaction(async (tx) => {
      // updatedAt lo genera el ORM (new Date(), milisegundos), así que sirve
      // de control optimista sin añadir una columna de versión.
      const updated = await tx.orm.dentistry.ClinicalFile.where({
        id,
        organizationId: scope.organizationId,
        patientId: scope.patientId,
        uploadStatus: 'READY',
        deletedAt: null,
        updatedAt: expectedUpdatedAt,
      }).update(change);
      if (!updated) return null;
      await writeAuditLog(tx, {
        organizationId: scope.organizationId,
        actorMembershipId,
        action: 'CLINICAL_FILE_UPDATED',
        resource: 'ClinicalFile',
        resourceId: id,
        metadata: { patientId: scope.patientId, fields: Object.keys(change) },
      });
      return updated;
    });
    return row ? toClinicalFileEntity(row) : null;
  }

  async markFailed(scope: ClinicalFileScope, id: string): Promise<void> {
    await this.prisma.orm.dentistry.ClinicalFile.where({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      uploadStatus: 'PENDING',
    }).update({ uploadStatus: 'FAILED', uploadExpiresAt: null });
  }

  async softDelete(
    scope: ClinicalFileScope,
    id: string,
    actorMembershipId: string,
    now: Date,
  ): Promise<ClinicalFile | null> {
    const row = await this.prisma.transaction(async (tx) => {
      const updated = await tx.orm.dentistry.ClinicalFile.where({
        id,
        organizationId: scope.organizationId,
        patientId: scope.patientId,
        deletedAt: null,
      }).update({ deletedAt: now, deletedByMembershipId: actorMembershipId });
      if (!updated) return null;
      await writeAuditLog(tx, {
        organizationId: scope.organizationId,
        actorMembershipId,
        action: 'CLINICAL_FILE_DELETED',
        resource: 'ClinicalFile',
        resourceId: id,
        metadata: { patientId: scope.patientId },
      });
      return updated;
    });
    return row ? toClinicalFileEntity(row) : null;
  }

  async usage(organizationId: string, now: Date): Promise<ClinicalFileUsage> {
    return { usedBytes: await usedBytes(this.prisma, organizationId, now) };
  }

  async findEncounter(
    scope: ClinicalFileScope,
    encounterId: string,
  ): Promise<EncounterReference | null> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.first({
      id: encounterId,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    return row ? { branchId: row.branchId, status: row.status } : null;
  }
}
