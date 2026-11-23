export const PAYMENT_METHODS = ['CASH', 'TRANSFER', 'QR', 'CARD'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['COMPLETED', 'VOIDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Dinero recibido. No es presupuesto, cargo ni saldo. */
export interface Payment {
  id: string;
  organizationId: string;
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
  paidAt: Date;
  receivedByMembershipId: string;
  voidedAt: Date | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Lo que el registro de un pago necesita saber de su tratamiento. */
export interface TreatmentSnapshot {
  id: string;
  title: string | null;
  status: string;
  agreedPriceMinor: number | null;
  currency: string | null;
  /** Suma de los pagos COMPLETED, leída bajo el bloqueo del tratamiento. */
  paidMinor: number;
}

/** Lo que el registro de un pago necesita saber de su atención. */
export interface EncounterSnapshot {
  id: string;
  branchId: string;
  appointmentId: string | null;
  treatmentId: string | null;
  status: string;
  /** Pago COMPLETED vigente de la atención, si existe (relación 1:1). */
  activePaymentId: string | null;
}

/** Un movimiento del estado de cuenta de un tratamiento. */
export interface AccountMovement {
  payment: Payment;
  /** Saldo tras este pago; `null` si el pago está anulado o no hay presupuesto. */
  runningBalanceMinor: number | null;
}

export interface TreatmentAccount {
  treatment: TreatmentSnapshot;
  movements: AccountMovement[];
  balanceMinor: number | null;
}
