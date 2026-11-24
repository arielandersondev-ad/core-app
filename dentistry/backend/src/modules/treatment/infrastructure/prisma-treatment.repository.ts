import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import type { TreatmentWithBalance } from '../domain/entities/treatment.entity.js';
import {
  TreatmentRepository,
  type FindTreatmentsFilters,
  type TreatmentChange,
  type TreatmentCreateData,
  type TreatmentScope,
} from '../domain/repositories/treatment.repository.js';
import { lockTreatmentBalance } from './treatment-lock.js';
import {
  sumPaidByTreatment,
  toTreatmentEntity,
  withBalance,
  type TreatmentRow,
} from './treatment.mapper.js';

type Client = Pick<TransactionContext, 'orm'>;

@Injectable()
export class PrismaTreatmentRepository extends TreatmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage(
    filters: FindTreatmentsFilters,
  ): Promise<PaginatedResult<TreatmentWithBalance>> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);

    let query = this.prisma.orm.dentistry.Treatment.where({
      organizationId: filters.organizationId,
      patientId: filters.patientId,
    });
    if (filters.status) query = query.where({ status: filters.status });

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));
    const rows = await query
      .orderBy([
        (treatment) => treatment.createdAt.desc(),
        (treatment) => treatment.id.desc(),
      ])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .all();

    return createPaginatedResult(
      await this.hydrate(this.prisma, filters.organizationId, rows),
      { page, pageSize, limit: pageSize },
      totalItems,
    );
  }

  async findById(
    scope: TreatmentScope,
    id: string,
  ): Promise<TreatmentWithBalance | null> {
    const row = await this.prisma.orm.dentistry.Treatment.first({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    if (!row) return null;
    const [treatment] = await this.hydrate(this.prisma, scope.organizationId, [
      row,
    ]);
    return treatment;
  }

  async serviceExists(
    organizationId: string,
    serviceId: string,
  ): Promise<boolean> {
    const row = await this.prisma.orm.dentistry.DentalService.first({
      id: serviceId,
      organizationId,
    });
    return row !== null;
  }

  async create(data: TreatmentCreateData): Promise<TreatmentWithBalance> {
    const row = await this.prisma.orm.dentistry.Treatment.create({
      organizationId: data.organizationId,
      patientId: data.patientId,
      serviceId: data.serviceId,
      title: data.title,
      practitionerMembershipId: data.practitionerMembershipId,
      status: 'PROPOSED',
      estimatedSessions: data.estimatedSessions,
      agreedPriceMinor: data.agreedPriceMinor,
      currency: data.currency,
      diagnosisSummary: data.diagnosisSummary,
      notes: data.notes,
      createdByMembershipId: data.createdByMembershipId,
    });
    const [treatment] = await this.hydrate(this.prisma, data.organizationId, [
      row,
    ]);
    return treatment;
  }

  async update(
    scope: TreatmentScope,
    id: string,
    decide: (current: TreatmentWithBalance) => TreatmentChange,
  ): Promise<TreatmentWithBalance | null> {
    return this.prisma.transaction(async (tx) => {
      await lockTreatmentBalance(tx, id);
      const where = {
        id,
        organizationId: scope.organizationId,
        patientId: scope.patientId,
      };
      const row = await tx.orm.dentistry.Treatment.first(where);
      if (!row) return null;
      const [current] = await this.hydrate(tx, scope.organizationId, [row]);

      const change = decide(current);
      const saved = await tx.orm.dentistry.Treatment.where(where).update(
        definedOnly(change),
      );
      if (!saved) return null;
      const [updated] = await this.hydrate(tx, scope.organizationId, [saved]);
      return updated;
    });
  }

  /** Añade nombre del servicio y dinero recibido (pagos COMPLETED) a cada fila. */
  private async hydrate(
    client: Client,
    organizationId: string,
    rows: TreatmentRow[],
  ): Promise<TreatmentWithBalance[]> {
    if (rows.length === 0) return [];
    const treatmentIds = rows.map((row) => row.id);
    const serviceIds = [
      ...new Set(rows.flatMap((row) => (row.serviceId ? [row.serviceId] : []))),
    ];

    const loadServices = async (): Promise<{ id: string; name: string }[]> =>
      serviceIds.length === 0
        ? []
        : client.orm.dentistry.DentalService.where({ organizationId })
            .where((service) => service.id.in(serviceIds))
            .all();
    const [services, payments] = await Promise.all([
      loadServices(),
      client.orm.dentistry.Payment.where({
        organizationId,
        status: 'COMPLETED',
      })
        .where((payment) => payment.treatmentId.in(treatmentIds))
        .all(),
    ]);

    const serviceNames = new Map<string, string>(
      services.map((service) => [service.id, service.name]),
    );
    const paid = sumPaidByTreatment(payments);
    return rows.map((row) =>
      withBalance(toTreatmentEntity(row, serviceNames), paid.get(row.id) ?? 0),
    );
  }
}

/** Quita las claves `undefined`: significan "sin cambio", no "poner a null". */
function definedOnly(change: TreatmentChange): TreatmentChange {
  return Object.fromEntries(
    Object.entries(change).filter(([, value]) => value !== undefined),
  ) as TreatmentChange;
}
