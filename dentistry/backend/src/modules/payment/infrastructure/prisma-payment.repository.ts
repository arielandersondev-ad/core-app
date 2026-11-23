import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import { lockTreatmentBalance } from '../../treatment/infrastructure/treatment-lock.js';
import { PaymentErrors } from '../application/payment.errors.js';
import type {
  EncounterSnapshot,
  Payment,
  TreatmentSnapshot,
} from '../domain/entities/payment.entity.js';
import {
  PaymentRepository,
  type FindPaymentsFilters,
  type PaymentInsert,
  type PaymentScope,
  type RegistrationContext,
  type RegistrationRequest,
  type VoidData,
} from '../domain/repositories/payment.repository.js';
import { lockEncounterPayment } from './payment-lock.js';
import { sumReceived, toPaymentEntity } from './payment.mapper.js';

type Client = Pick<TransactionContext, 'orm'>;

/** Violación de unicidad del índice parcial: ya hay un pago vigente en la atención. */
function rethrowEncounterPaid(error: unknown): never {
  if (hasPostgresCode(error, '23505')) throw PaymentErrors.encounterAlreadyPaid();
  throw error;
}

@Injectable()
export class PrismaPaymentRepository extends PaymentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findPage(filters: FindPaymentsFilters): Promise<PaginatedResult<Payment>> {
    const page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);
    const pagination = { page, pageSize, limit: pageSize };
    if (filters.authorizedBranchIds.length === 0) {
      return createPaginatedResult([], pagination, 0);
    }

    let query = this.prisma.orm.dentistry.Payment.where({
      organizationId: filters.organizationId,
      patientId: filters.patientId,
    }).where((payment) => payment.branchId.in(filters.authorizedBranchIds));
    if (filters.treatmentId) {
      query = query.where({ treatmentId: filters.treatmentId });
    }
    if (filters.status) query = query.where({ status: filters.status });

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));
    const rows = await query
      .orderBy([
        (payment) => payment.paidAt.desc(),
        (payment) => payment.id.desc(),
      ])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .all();
    return createPaginatedResult(rows.map(toPaymentEntity), pagination, totalItems);
  }

  async findById(scope: PaymentScope, id: string): Promise<Payment | null> {
    const row = await this.prisma.orm.dentistry.Payment.first({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    return row ? toPaymentEntity(row) : null;
  }

  async findActiveByEncounter(
    scope: PaymentScope,
    encounterId: string,
  ): Promise<Payment | null> {
    const row = await this.prisma.orm.dentistry.Payment.first({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      clinicalEncounterId: encounterId,
      status: 'COMPLETED',
    });
    return row ? toPaymentEntity(row) : null;
  }

  async findAccount(
    scope: PaymentScope,
    treatmentId: string,
  ): Promise<{ treatment: TreatmentSnapshot; payments: Payment[] } | null> {
    const treatment = await this.loadTreatment(this.prisma, scope, treatmentId);
    if (!treatment) return null;
    const rows = await this.prisma.orm.dentistry.Payment.where({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      treatmentId,
    }).all();
    return { treatment, payments: rows.map(toPaymentEntity) };
  }

  async register(
    request: RegistrationRequest,
    decide: (context: RegistrationContext) => PaymentInsert,
  ): Promise<Payment> {
    return this.prisma.transaction(async (tx) => {
      const scope: PaymentScope = {
        organizationId: request.organizationId,
        patientId: request.patientId,
      };

      let encounter: EncounterSnapshot | null = null;
      if (request.encounterId) {
        await lockEncounterPayment(tx, request.encounterId);
        encounter = await this.loadEncounter(tx, scope, request.encounterId);
      }

      const treatmentId = request.treatmentId ?? encounter?.treatmentId ?? null;
      let treatment: TreatmentSnapshot | null = null;
      if (treatmentId) {
        // El saldo se lee con el tratamiento bloqueado: sin el bloqueo, dos
        // cobros simultáneos verían el mismo saldo y ambos pasarían.
        await lockTreatmentBalance(tx, treatmentId);
        treatment = await this.loadTreatment(tx, scope, treatmentId);
      }

      const insert = decide({ treatment, encounter });
      const row = await tx.orm.dentistry.Payment.create({
        ...insert,
        status: 'COMPLETED',
      }).catch(rethrowEncounterPaid);
      return toPaymentEntity(row);
    });
  }

  async void(
    scope: PaymentScope,
    id: string,
    data: VoidData,
  ): Promise<Payment | null> {
    const row = await this.prisma.orm.dentistry.Payment.where({
      id,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      status: 'COMPLETED',
    }).update({
      status: 'VOIDED',
      voidedAt: data.voidedAt,
      voidedByMembershipId: data.voidedByMembershipId,
      voidReason: data.voidReason,
    });
    return row ? toPaymentEntity(row) : null;
  }

  private async loadTreatment(
    client: Client,
    scope: PaymentScope,
    treatmentId: string,
  ): Promise<TreatmentSnapshot | null> {
    const row = await client.orm.dentistry.Treatment.first({
      id: treatmentId,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    if (!row) return null;
    const payments = await client.orm.dentistry.Payment.where({
      organizationId: scope.organizationId,
      treatmentId,
    }).all();
    return {
      id: row.id,
      title: row.title,
      status: row.status,
      agreedPriceMinor: row.agreedPriceMinor,
      currency: row.currency,
      paidMinor: sumReceived(payments),
    };
  }

  private async loadEncounter(
    client: Client,
    scope: PaymentScope,
    encounterId: string,
  ): Promise<EncounterSnapshot | null> {
    const row = await client.orm.dentistry.ClinicalEncounter.first({
      id: encounterId,
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    if (!row) return null;
    const active = await client.orm.dentistry.Payment.first({
      organizationId: scope.organizationId,
      clinicalEncounterId: encounterId,
      status: 'COMPLETED',
    });
    return {
      id: row.id,
      branchId: row.branchId,
      appointmentId: row.appointmentId,
      treatmentId: row.treatmentId,
      status: row.status,
      activePaymentId: active?.id ?? null,
    };
  }
}
