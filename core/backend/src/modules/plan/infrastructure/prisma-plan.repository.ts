import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { isPostgresUniqueViolation } from '../../../common/infrastructure/postgres-error.js';
import type { CreatePlan, Plan, UpdatePlan } from '../domain/entities/plan.entity.js';
import type {
  AssignPlan,
  AssignmentStatus,
  ChangeAssignmentStatus,
  PlanAssignment,
} from '../domain/entities/plan-assignment.entity.js';
import { PlanRepository } from '../domain/repositories/plan.repository.js';
import { toPlanEntity } from './plan.mapper.js';

const PLAN_CODE_UNIQUE_CONSTRAINT = 'Plan_code_key';
const ASSIGNMENT_UNIQUE_CONSTRAINT = 'organization_plan_vertical_uidx_1e389c18';

@Injectable()
export class PrismaPlanRepository extends PlanRepository {
  constructor(private readonly prisma: PrismaService) { super(); }

  async list(): Promise<Plan[]> {
    const rows = await this.prisma.orm.core.Plan.where({ deleted: false }).all();
    return rows.map(toPlanEntity);
  }

  async findById(planId: string): Promise<Plan | null> {
    const row = await this.prisma.orm.core.Plan.first({ id: toUuid36(planId) });
    return row && !row.deleted ? toPlanEntity(row) : null;
  }

  async create(input: CreatePlan): Promise<Plan> {
    this.assertPrice(input.priceMinor, input.currency);
    try {
      return await this.prisma.transaction(async (tx) => {
        const duplicate = await tx.orm.core.Plan.first({ code: input.code });
        if (duplicate) throw new ConflictException('Ya existe un plan con ese código');

        const row = await tx.orm.core.Plan.create(input);
        await writeAuditLog(tx, {
          action: 'PLAN_CREATED', resource: 'Plan', resourceId: row.id,
          metadata: { code: row.code, vertical: row.vertical },
        });
        return toPlanEntity(row);
      });
    } catch (error) {
      if (isPostgresUniqueViolation(error, [PLAN_CODE_UNIQUE_CONSTRAINT])) {
        throw new ConflictException('Ya existe un plan con ese código');
      }
      throw error;
    }
  }

  async update(planId: string, input: UpdatePlan): Promise<Plan> {
    return this.prisma.transaction(async (tx) => {
      const current = await tx.orm.core.Plan.first({ id: toUuid36(planId) });
      if (!current || current.deleted) throw new NotFoundException('Plan no encontrado');

      this.assertPrice(
        input.priceMinor === undefined ? current.priceMinor : input.priceMinor,
        input.currency === undefined ? current.currency : input.currency,
      );
      const row = await tx.orm.core.Plan.where({ id: current.id }).update(input);
      if (!row) throw new NotFoundException('Plan no encontrado');
      await writeAuditLog(tx, {
        action: 'PLAN_UPDATED', resource: 'Plan', resourceId: row.id,
        metadata: { fields: Object.keys(input) },
      });
      return toPlanEntity(row);
    });
  }

  async softDelete(planId: string): Promise<Plan> {
    return this.prisma.transaction(async (tx) => {
      const current = await tx.orm.core.Plan.first({ id: toUuid36(planId) });
      if (!current || current.deleted) throw new NotFoundException('Plan no encontrado');

      const assignments = await tx.orm.core.OrganizationPlan.where({ planId: current.id }).all();
      if (assignments.some((assignment) => assignment.status !== 'CANCELED')) {
        throw new ConflictException('El plan tiene asignaciones vigentes; cancélelas antes de eliminarlo');
      }

      const row = await tx.orm.core.Plan.where({ id: current.id }).update({
        active: false,
        deleted: true,
        deletedAt: new Date(),
      });
      if (!row) throw new NotFoundException('Plan no encontrado');
      await writeAuditLog(tx, {
        action: 'PLAN_DELETED', resource: 'Plan', resourceId: row.id,
        metadata: { code: row.code },
      });
      return toPlanEntity(row);
    });
  }

  async listAssignments(organizationId?: string): Promise<PlanAssignment[]> {
    const rows = organizationId
      ? await this.prisma.orm.core.OrganizationPlan.where({ organizationId: toUuid36(organizationId) }).all()
      : await this.prisma.orm.core.OrganizationPlan.all();
    return Promise.all(rows.map((row) => this.enrichAssignment(this.prisma.orm.core, row)));
  }

  async assign(input: AssignPlan): Promise<PlanAssignment> {
    try {
      return await this.prisma.transaction(async (tx) => {
        const organization = await tx.orm.core.Organization.first({ id: toUuid36(input.organizationId) });
        if (!organization || organization.deleted) throw new NotFoundException('Organización no encontrada');
        if (organization.status !== 'ACTIVE') throw new ConflictException('La organización no está activa');

        const plan = await tx.orm.core.Plan.first({ id: toUuid36(input.planId) });
        if (!plan || plan.deleted) throw new NotFoundException('Plan no encontrado');
        if (!plan.active) throw new ConflictException('El plan no está activo');
        if (plan.vertical !== input.vertical) {
          throw new BadRequestException('El plan no corresponde a la vertical indicada');
        }

        const endsAt = new Date(input.startsAt.getTime() + plan.durationDays * 86_400_000);
        const existing = await tx.orm.core.OrganizationPlan.where({
          organizationId: organization.id,
          vertical: input.vertical,
        }).first();

        const values = {
          planId: plan.id,
          vertical: input.vertical,
          status: input.status,
          startsAt: input.startsAt,
          endsAt,
          renewalPreference: 'UNDECIDED',
          renewalCount: 0,
          lastRenewedAt: null,
          suspendedAt: null,
          suspensionReason: null,
          canceledAt: null,
        };
        const row = existing
          ? await tx.orm.core.OrganizationPlan.where({ id: existing.id }).update(values)
          : await tx.orm.core.OrganizationPlan.create({ organizationId: organization.id, ...values });
        if (!row) throw new ConflictException('No se pudo actualizar la asignación');

        await writeAuditLog(tx, {
          organizationId: organization.id,
          action: existing ? 'ORGANIZATION_PLAN_REPLACED' : 'ORGANIZATION_PLAN_ASSIGNED',
          resource: 'OrganizationPlan', resourceId: row.id,
          metadata: { planId: String(plan.id), vertical: input.vertical, status: input.status },
        });
        return this.toAssignment(row, organization.name, plan.code, plan.name);
      });
    } catch (error) {
      if (isPostgresUniqueViolation(error, [ASSIGNMENT_UNIQUE_CONSTRAINT])) {
        throw new ConflictException('La organización ya tiene un plan para esta vertical');
      }
      throw error;
    }
  }

  async changeAssignmentStatus(input: ChangeAssignmentStatus): Promise<PlanAssignment> {
    return this.prisma.transaction(async (tx) => {
      const row = await tx.orm.core.OrganizationPlan.where({
        organizationId: toUuid36(input.organizationId), vertical: input.vertical,
      }).first();
      if (!row) throw new NotFoundException('Asignación de plan no encontrada');
      if (row.status === 'CANCELED' && input.status !== 'CANCELED') {
        throw new ConflictException('Una asignación cancelada no puede reactivarse; reasigne el plan');
      }
      if (input.status === 'SUSPENDED' && !input.reason?.trim()) {
        throw new BadRequestException('Debe indicar el motivo de suspensión');
      }
      if (row.status === input.status) return this.enrichAssignment(tx.orm.core, row);
      if (input.status === 'ACTIVE' && row.endsAt <= new Date()) {
        throw new ConflictException('No se puede activar una asignación vencida; reasigne el plan');
      }
      const now = new Date();
      const updated = await tx.orm.core.OrganizationPlan.where({ id: row.id }).update({
        status: input.status,
        suspendedAt: input.status === 'SUSPENDED' ? now : null,
        suspensionReason: input.status === 'SUSPENDED' ? input.reason?.trim() : null,
        canceledAt: input.status === 'CANCELED' ? now : null,
      });
      if (!updated) throw new NotFoundException('Asignación de plan no encontrada');
      await writeAuditLog(tx, {
        organizationId: input.organizationId,
        action: 'ORGANIZATION_PLAN_STATUS_CHANGED',
        resource: 'OrganizationPlan', resourceId: updated.id,
        metadata: { vertical: input.vertical, status: input.status, reason: input.reason ?? null },
      });
      return this.enrichAssignment(tx.orm.core, updated);
    });
  }

  private assertPrice(priceMinor: number | null, currency: string | null): void {
    if ((priceMinor === null) !== (currency === null)) {
      throw new BadRequestException('priceMinor y currency deben informarse juntos');
    }
  }

  private async enrichAssignment(core: typeof this.prisma.orm.core, row: Parameters<typeof this.toAssignment>[0]): Promise<PlanAssignment> {
    const organization = await core.Organization.first({ id: toUuid36(row.organizationId) });
    const plan = await core.Plan.first({ id: toUuid36(row.planId) });
    if (!organization || !plan) throw new NotFoundException('La asignación referencia datos inexistentes');
    return this.toAssignment(row, organization.name, plan.code, plan.name);
  }

  private toAssignment(
    row: {
      id: string; organizationId: string; planId: string; vertical: string; status: string;
      startsAt: Date; endsAt: Date; renewalPreference: string; renewalCount: number;
      lastRenewedAt: Date | null; suspendedAt: Date | null; suspensionReason: string | null;
      canceledAt: Date | null; createdAt: Date; updatedAt: Date;
    },
    organizationName: string,
    planCode: string,
    planName: string,
  ): PlanAssignment {
    return {
      ...row,
      organizationId: String(row.organizationId),
      planId: String(row.planId),
      organizationName,
      planCode,
      planName,
      status: row.status as AssignmentStatus,
    };
  }
}
