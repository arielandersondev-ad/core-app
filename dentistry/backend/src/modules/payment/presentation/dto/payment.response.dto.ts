import type {
  AccountMovement,
  Payment,
  PaymentMethod,
  PaymentStatus,
  TreatmentAccount,
} from '../../domain/entities/payment.entity.js';

export class PaymentResponseDto {
  id: string;
  branchId: string;
  patientId: string;
  treatmentId: string | null;
  appointmentId: string | null;
  clinicalEncounterId: string | null;
  amountMinor: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  notes: string | null;
  paidAt: string;
  receivedByMembershipId: string;
  voidedAt: string | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
  createdAt: string;

  static fromEntity(payment: Payment): PaymentResponseDto {
    return {
      id: payment.id,
      branchId: payment.branchId,
      patientId: payment.patientId,
      treatmentId: payment.treatmentId,
      appointmentId: payment.appointmentId,
      clinicalEncounterId: payment.clinicalEncounterId,
      amountMinor: payment.amountMinor,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt.toISOString(),
      receivedByMembershipId: payment.receivedByMembershipId,
      voidedAt: payment.voidedAt?.toISOString() ?? null,
      voidedByMembershipId: payment.voidedByMembershipId,
      voidReason: payment.voidReason,
      createdAt: payment.createdAt.toISOString(),
    };
  }
}

export class AccountMovementResponseDto extends PaymentResponseDto {
  /** Saldo tras este pago; `null` si está anulado o no hay presupuesto. */
  runningBalanceMinor: number | null;

  static fromMovement(movement: AccountMovement): AccountMovementResponseDto {
    return {
      ...PaymentResponseDto.fromEntity(movement.payment),
      runningBalanceMinor: movement.runningBalanceMinor,
    };
  }
}

export class TreatmentAccountResponseDto {
  treatment: {
    id: string;
    title: string | null;
    status: string;
    agreedPriceMinor: number | null;
    currency: string | null;
  };
  /** Dinero recibido (pagos COMPLETED). */
  paidMinor: number;
  /** Presupuesto − recibido; `null` si el tratamiento no tiene presupuesto. */
  balanceMinor: number | null;
  movements: AccountMovementResponseDto[];

  static fromAccount(account: TreatmentAccount): TreatmentAccountResponseDto {
    const { treatment } = account;
    return {
      treatment: {
        id: treatment.id,
        title: treatment.title,
        status: treatment.status,
        agreedPriceMinor: treatment.agreedPriceMinor,
        currency: treatment.currency,
      },
      paidMinor: treatment.paidMinor,
      balanceMinor: account.balanceMinor,
      movements: account.movements.map(AccountMovementResponseDto.fromMovement),
    };
  }
}
