import { Injectable } from '@nestjs/common';
import type { Payment } from '../../domain/entities/payment.entity.js';
import {
  PaymentRepository,
  type PaymentScope,
} from '../../domain/repositories/payment.repository.js';
import { PaymentAccess } from '../payment-access.js';
import { decideEncounterPayment, type PaymentInput } from '../payment-rules.js';

export type RegisterEncounterPaymentCommand = PaymentScope & {
  encounterId: string;
  /** Tratamiento que reduce el pago; por defecto, el de la atención. */
  treatmentId?: string;
  authorizedBranchIds: string[];
  input: PaymentInput;
  actorMembershipId: string;
};

/** Pago de una atención: a lo sumo uno vigente por atención (1:1). */
@Injectable()
export class RegisterEncounterPaymentUseCase {
  constructor(
    private readonly access: PaymentAccess,
    private readonly payments: PaymentRepository,
  ) {}

  async execute(command: RegisterEncounterPaymentCommand): Promise<Payment> {
    const scope: PaymentScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);
    return this.payments.register(
      {
        ...scope,
        treatmentId: command.treatmentId ?? null,
        encounterId: command.encounterId,
      },
      (context) =>
        decideEncounterPayment(context, {
          ...scope,
          requestedTreatmentId: command.treatmentId,
          authorizedBranchIds: command.authorizedBranchIds,
          input: command.input,
          actorMembershipId: command.actorMembershipId,
          now: new Date(),
        }),
    );
  }
}
