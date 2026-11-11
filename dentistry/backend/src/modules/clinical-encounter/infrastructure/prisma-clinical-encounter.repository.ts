import { Injectable } from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import { ClinicalErrors } from '../application/clinical-encounter.errors.js';
import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
} from '../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type AppointmentReference,
  type ClinicalEncounterCreateData,
  type EncounterReferenceData,
  type EncounterScope,
  type EncounterTransition,
  type FindEncountersFilters,
  type ProcedureCreateData,
  type TreatmentProcedureReference,
} from '../domain/repositories/clinical-encounter.repository.js';
import {
  toEncounterEntity,
  toProcedureEntity,
  type ClinicalEncounterProcedureRow,
  type ClinicalEncounterRow,
  type EncounterNames,
} from './clinical-encounter.mapper.js';

const OPEN_TREATMENT_STATUSES = ['PROPOSED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD'];
const OPEN_TREATMENT_PROCEDURE_STATUSES = ['PLANNED', 'IN_PROGRESS'];
const LINKABLE_APPOINTMENT_STATUSES_EXCLUDED = new Set(['CANCELED', 'NO_SHOW']);

@Injectable()
export class PrismaClinicalEncounterRepository extends ClinicalEncounterRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage(
    filters: FindEncountersFilters,
  ): Promise<PaginatedResult<ClinicalEncounter>> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
    const pagination = { page, pageSize, limit: pageSize };
    if (filters.authorizedBranchIds.length === 0) {
      return createPaginatedResult([], pagination, 0);
    }

    let query = this.prisma.orm.dentistry.ClinicalEncounter.where({
      organizationId: filters.organizationId,
      patientId: filters.patientId,
    }).where((encounter) =>
      encounter.branchId.in(filters.authorizedBranchIds),
    );
    if (filters.status) query = query.where({ status: filters.status });
    if (filters.practitionerMembershipId) {
      query = query.where({
        practitionerMembershipId: filters.practitionerMembershipId,
      });
    }
    if (filters.search) {
      // Escapa comodines SQL para que la búsqueda sea una subcadena literal.
      const pattern = '%' + filters.search.replace(/[\\%_]/g, '\\$&') + '%';
      query = query.where((encounter) =>
        or(
          encounter.chiefComplaint.ilike(pattern),
          encounter.examinationSummary.ilike(pattern),
          encounter.diagnosisSummary.ilike(pattern),
          encounter.procedureSummary.ilike(pattern),
          encounter.notes.ilike(pattern),
          encounter.procedures.some((procedure) =>
            procedure.description.ilike(pattern),
          ),
        ),
      );
    }

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));
    const rows = await query
      .orderBy([
        (encounter) => encounter.startedAt.desc(),
        (encounter) => encounter.id.desc(),
      ])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .all();

    return createPaginatedResult(
      await this.hydrate(filters.organizationId, rows),
      pagination,
      totalItems,
    );
  }

  async findById(
    scope: EncounterScope,
    id: string,
  ): Promise<ClinicalEncounter | null> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.first({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    if (!row) return null;
    const [encounter] = await this.hydrate(scope.organizationId, [row]);
    return encounter;
  }

  async create(data: ClinicalEncounterCreateData): Promise<ClinicalEncounter> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.create({
      organizationId: data.organizationId,
      patientId: data.patientId,
      branchId: data.branchId,
      practitionerMembershipId: data.practitionerMembershipId,
      appointmentId: data.appointmentId,
      treatmentId: data.treatmentId,
      startedAt: data.startedAt,
      chiefComplaint: data.chiefComplaint,
      examinationSummary: data.examinationSummary,
      diagnosisSummary: data.diagnosisSummary,
      procedureSummary: data.procedureSummary,
      progressNotes: data.progressNotes,
      patientInstructions: data.patientInstructions,
      notes: data.notes,
      status: 'IN_PROGRESS',
      createdByMembershipId: data.createdByMembershipId,
    }).catch((error: unknown) => {
      if (hasPostgresCode(error, '23505')) {
        throw ClinicalErrors.appointmentTaken();
      }
      throw error;
    });
    const [encounter] = await this.hydrate(data.organizationId, [row]);
    return encounter;
  }

  async transition(
    scope: EncounterScope,
    id: string,
    expectedRowVersion: number,
    change: EncounterTransition,
  ): Promise<ClinicalEncounter | null> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.where({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      rowVersion: expectedRowVersion,
    }).update({ ...change, rowVersion: expectedRowVersion + 1 });
    if (!row) return null;
    const [encounter] = await this.hydrate(scope.organizationId, [row]);
    return encounter;
  }

  async addProcedures(
    scope: EncounterScope,
    encounterId: string,
    expectedRowVersion: number,
    procedures: ProcedureCreateData[],
    actorMembershipId: string,
  ): Promise<ClinicalEncounterProcedure[] | null> {
    return this.prisma.transaction(async (tx) => {
      // Subir la versión bajo la condición IN_PROGRESS serializa el lote con
      // completar/anular: si la atención cambió, no se inserta nada.
      const locked = await tx.orm.dentistry.ClinicalEncounter.where({
        id: encounterId,
        organizationId: scope.organizationId,
        patientId: scope.patientId,
        status: 'IN_PROGRESS',
        rowVersion: expectedRowVersion,
      }).update({
        rowVersion: expectedRowVersion + 1,
        updatedByMembershipId: actorMembershipId,
      });
      if (!locked) return null;

      const created: ClinicalEncounterProcedure[] = [];
      for (const procedure of procedures) {
        const row = await tx.orm.dentistry.ClinicalEncounterProcedure.create({
          organizationId: scope.organizationId,
          patientId: scope.patientId,
          clinicalEncounterId: encounterId,
          treatmentProcedureId: procedure.treatmentProcedureId,
          targetType: procedure.targetType,
          toothNumber: procedure.toothNumber,
          targetDescription: procedure.targetDescription,
          description: procedure.description,
          status: 'RECORDED',
          createdByMembershipId: actorMembershipId,
        });
        created.push(toProcedureEntity(row));
      }
      return created;
    });
  }

  async findAppointment(
    scope: EncounterScope,
    appointmentId: string,
  ): Promise<AppointmentReference | null> {
    const row = await this.prisma.orm.dentistry.Appointment.first({
      id: appointmentId,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    return row
      ? { id: row.id, branchId: row.branchId, status: row.status }
      : null;
  }

  async treatmentExists(
    scope: EncounterScope,
    treatmentId: string,
  ): Promise<boolean> {
    const row = await this.prisma.orm.dentistry.Treatment.first({
      id: treatmentId,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    return row !== null;
  }

  async findTreatmentProcedures(
    scope: EncounterScope,
    ids: string[],
  ): Promise<TreatmentProcedureReference[]> {
    const rows = await this.prisma.orm.dentistry.TreatmentProcedure.where({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    })
      .where((procedure) => procedure.id.in(ids))
      .all();
    return rows.map((row) => ({
      id: row.id,
      treatmentId: row.treatmentId,
      status: row.status,
    }));
  }

  async getReferenceData(
    scope: EncounterScope & {
      authorizedBranchIds: string[];
      membershipId: string;
    },
  ): Promise<EncounterReferenceData> {
    const where = {
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    };
    const [branches, memberships, appointments, linked, treatments, services] =
      await Promise.all([
        this.findBranches(scope.organizationId, scope.authorizedBranchIds),
        this.resolveMembershipNames(scope.organizationId, [scope.membershipId]),
        this.prisma.orm.dentistry.Appointment.where(where)
          .orderBy((appointment) => appointment.scheduledStartAt.desc())
          .all(),
        this.prisma.orm.dentistry.ClinicalEncounter.where(where)
          .select('appointmentId')
          .all(),
        this.prisma.orm.dentistry.Treatment.where(where)
          .where((treatment) => treatment.status.in(OPEN_TREATMENT_STATUSES))
          .orderBy((treatment) => treatment.createdAt.desc())
          .all(),
        this.prisma.orm.dentistry.DentalService.where({
          organizationId: scope.organizationId,
        }).all(),
      ]);

    const treatmentIds = treatments.map((treatment) => treatment.id);
    const plannedProcedures =
      treatmentIds.length === 0
        ? []
        : await this.prisma.orm.dentistry.TreatmentProcedure.where(where)
            .where((procedure) =>
              procedure.treatmentId.in(treatmentIds),
            )
            .where((procedure) =>
              procedure.status.in(OPEN_TREATMENT_PROCEDURE_STATUSES),
            )
            .orderBy([
              (procedure) => procedure.treatmentId.asc(),
              (procedure) => procedure.position.asc(),
            ])
            .all();

    const branchById = new Map(branches.map((branch) => [branch.id, branch]));
    const linkedAppointmentIds = new Set(
      linked.map((row) => row.appointmentId).filter(Boolean),
    );
    const serviceNames = new Map(
      services.map((service) => [service.id, service.name]),
    );

    return {
      branches: branches.map((branch) => ({
        id: branch.id,
        label: branch.name,
      })),
      practitioners: [
        {
          id: scope.membershipId,
          label: memberships.get(scope.membershipId) ?? 'Profesional en sesión',
        },
      ],
      appointments: appointments
        .filter(
          (appointment) =>
            branchById.has(appointment.branchId) &&
            !LINKABLE_APPOINTMENT_STATUSES_EXCLUDED.has(appointment.status) &&
            !linkedAppointmentIds.has(appointment.id),
        )
        .map((appointment) => ({
          id: appointment.id,
          ...(appointment.treatmentId
            ? { treatmentId: appointment.treatmentId }
            : {}),
          label: [
            formatInstant(
              appointment.scheduledStartAt,
              branchById.get(appointment.branchId)?.timezone,
            ),
            appointment.reason?.trim(),
          ]
            .filter(Boolean)
            .join(' · '),
        })),
      treatments: treatments.map((treatment) => ({
        id: treatment.id,
        label:
          (treatment.serviceId && serviceNames.get(treatment.serviceId)) ||
          treatment.diagnosisSummary?.trim() ||
          treatment.notes?.trim() ||
          'Tratamiento sin descripción',
      })),
      treatmentProcedures: plannedProcedures.map((procedure) => ({
        id: procedure.id,
        treatmentId: procedure.treatmentId,
        label: procedure.toothNumber
          ? `${procedure.description} · pieza ${procedure.toothNumber}`
          : procedure.description,
      })),
    };
  }

  /** Añade procedimientos y nombres de presentación a las filas de atención. */
  private async hydrate(
    organizationId: string,
    rows: ClinicalEncounterRow[],
  ): Promise<ClinicalEncounter[]> {
    if (rows.length === 0) return [];
    const encounterIds = rows.map((row) => row.id);
    const membershipIds = rows.flatMap((row) =>
      row.completedByMembershipId
        ? [row.practitionerMembershipId, row.completedByMembershipId]
        : [row.practitionerMembershipId],
    );
    const [procedureRows, branches, memberships] = await Promise.all([
      this.prisma.orm.dentistry.ClinicalEncounterProcedure.where({
        organizationId,
      })
        .where((procedure) => procedure.clinicalEncounterId.in(encounterIds))
        .orderBy([
          (procedure) => procedure.createdAt.asc(),
          (procedure) => procedure.id.asc(),
        ])
        .all(),
      this.findBranches(
        organizationId,
        rows.map((row) => row.branchId),
      ),
      this.resolveMembershipNames(organizationId, membershipIds),
    ]);

    const proceduresByEncounter = new Map<
      string,
      ClinicalEncounterProcedureRow[]
    >();
    for (const procedure of procedureRows) {
      const list = proceduresByEncounter.get(procedure.clinicalEncounterId) ?? [];
      list.push(procedure);
      proceduresByEncounter.set(procedure.clinicalEncounterId, list);
    }
    const names: EncounterNames = {
      branches: new Map(branches.map((branch) => [branch.id, branch.name])),
      memberships,
    };
    return rows.map((row) =>
      toEncounterEntity(row, proceduresByEncounter.get(row.id) ?? [], names),
    );
  }

  private async findBranches(
    organizationId: string,
    ids: string[],
  ): Promise<{ id: string; name: string; timezone: string }[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const rows = await this.prisma.orm.core.Branch.where({
      organizationId,
      deletedAt: null,
    })
      .where((branch) => branch.id.in(unique))
      .orderBy((branch) => branch.name.asc())
      .all();
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      timezone: row.timezone,
    }));
  }

  /** membershipId → "Nombre Apellido" del usuario global de Core. */
  private async resolveMembershipNames(
    organizationId: string,
    ids: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();
    const memberships = await this.prisma.orm.core.OrganizationMembership.where(
      { organizationId },
    )
      .where((membership) => membership.id.in(unique))
      .all();
    const userIds = [...new Set(memberships.map((row) => row.userId))];
    if (userIds.length === 0) return new Map();
    const users = await this.prisma.orm.core.User.where((user) =>
      user.id.in(userIds),
    ).all();
    const userNames = new Map(
      users.map((user) => [
        user.id,
        `${user.firstName} ${user.lastName}`.trim(),
      ]),
    );
    const names = new Map<string, string>();
    for (const membership of memberships) {
      const name = userNames.get(membership.userId);
      if (name) names.set(membership.id, name);
    }
    return names;
  }
}

function formatInstant(value: Date, timeZone: string | undefined): string {
  try {
    return new Intl.DateTimeFormat('es', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone,
    }).format(value);
  } catch {
    return value.toISOString();
  }
}
