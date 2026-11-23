import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type {
  Payment,
  TreatmentAccount,
} from '../../domain/entities/payment.entity.js';
import {
  PaymentRepository,
  type FindPaymentsFilters,
  type PaymentScope,
} from '../../domain/repositories/payment.repository.js';
import { PaymentAccess } from '../payment-access.js';
import { buildAccount } from '../payment-rules.js';
import { PaymentErrors } from '../payment.errors.js';

@Injectable()
export class ListPaymentsUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(filters: FindPaymentsFilters): Promise<PaginatedResult<Payment>> {
    await this.access.assertPatient(filters);
    return this.payments.findPage(filters);
  }
}

@Injectable()
export class GetPaymentUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(
    scope: PaymentScope,
    paymentId: string,
    authorizedBranchIds: string[],
  ): Promise<Payment> {
    await this.access.assertPatient(scope);
    const payment = await this.payments.findById(scope, paymentId);
    if (!payment) throw PaymentErrors.paymentNotFound();
    if (!authorizedBranchIds.includes(payment.branchId)) {
      throw PaymentErrors.branchForbidden();
    }
    return payment;
  }
}

/** Pago vigente (COMPLETED) de una atención; 404 si la atención aún no tiene abono. */
@Injectable()
export class GetEncounterPaymentUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(
    scope: PaymentScope,
    encounterId: string,
    authorizedBranchIds: string[],
  ): Promise<Payment> {
    await this.access.assertPatient(scope);
    const payment = await this.payments.findActiveByEncounter(scope, encounterId);
    if (!payment) throw PaymentErrors.paymentNotFound();
    if (!authorizedBranchIds.includes(payment.branchId)) {
      throw PaymentErrors.branchForbidden();
    }
    return payment;
  }
}

@Injectable()
export class GetTreatmentAccountUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(
    scope: PaymentScope,
    treatmentId: string,
  ): Promise<TreatmentAccount> {
    await this.access.assertPatient(scope);
    const account = await this.payments.findAccount(scope, treatmentId);
    if (!account) throw PaymentErrors.treatmentNotFound();
    return buildAccount(account.treatment, account.payments);
  }
}
