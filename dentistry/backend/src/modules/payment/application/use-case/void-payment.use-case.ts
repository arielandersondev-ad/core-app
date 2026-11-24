import { Injectable } from '@nestjs/common';
import type { Payment } from '../../domain/entities/payment.entity.js';
import {
  PaymentRepository,
  type PaymentScope,
} from '../../domain/repositories/payment.repository.js';
import { PaymentAccess } from '../payment-access.js';
import { requireVoidReason } from '../payment-rules.js';
import { PaymentErrors } from '../payment.errors.js';

export type VoidPaymentCommand = PaymentScope & {
  paymentId: string;
  authorizedBranchIds: string[];
  reason: string | null | undefined;
  actorMembershipId: string;
};

/** Anula un pago: el dinero deja de contar y el saldo del tratamiento se restablece. */
@Injectable()
export class VoidPaymentUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(command: VoidPaymentCommand): Promise<Payment> {
    const scope: PaymentScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);
    const voidReason = requireVoidReason(command.reason);

    const payment = await this.payments.findById(scope, command.paymentId);
    if (!payment) throw PaymentErrors.paymentNotFound();
    if (!command.authorizedBranchIds.includes(payment.branchId)) {
      throw PaymentErrors.branchForbidden();
    }
    if (payment.status === 'VOIDED') throw PaymentErrors.alreadyVoided();

    const voided = await this.payments.void(scope, command.paymentId, {
      voidedAt: new Date(),
      voidedByMembershipId: command.actorMembershipId,
      voidReason,
    });
    // Otra anulación simultánea ganó la carrera.
    if (!voided) throw PaymentErrors.alreadyVoided();
    return voided;
  }
}
