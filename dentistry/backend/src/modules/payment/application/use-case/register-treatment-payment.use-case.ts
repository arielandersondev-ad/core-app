import { Injectable } from '@nestjs/common';
import type { Payment } from '../../domain/entities/payment.entity.js';
import {
  PaymentRepository,
  type PaymentScope,
} from '../../domain/repositories/payment.repository.js';
import { PaymentAccess } from '../payment-access.js';
import { decideTreatmentPayment, type PaymentInput } from '../payment-rules.js';

export type RegisterTreatmentPaymentCommand = PaymentScope & {
  treatmentId: string;
  branchId?: string;
  authorizedBranchIds: string[];
  input: PaymentInput;
  actorMembershipId: string;
};

/** Anticipo, pago al contado o abono entre visitas, sin atención asociada. */
@Injectable()
export class RegisterTreatmentPaymentUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(command: RegisterTreatmentPaymentCommand): Promise<Payment> {
    const scope: PaymentScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);
    return this.payments.register(
      { ...scope, treatmentId: command.treatmentId, encounterId: null },
      (context) =>
        decideTreatmentPayment(context, {
          ...scope,
          treatmentId: command.treatmentId,
          branchId: command.branchId,
          authorizedBranchIds: command.authorizedBranchIds,
          input: command.input,
          actorMembershipId: command.actorMembershipId,
          now: new Date(),
        }),
    );
  }
}
