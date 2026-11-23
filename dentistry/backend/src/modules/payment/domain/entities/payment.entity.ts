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

/** Lo realizado en una atención, para proponer su cobro. */
export interface EncounterBilling {
  encounter: EncounterSnapshot;
  /** Precios de los procedimientos no anulados (solo los que tienen precio). */
  procedurePrices: { priceMinor: number; currency: string }[];
  /** Procedimientos no anulados, con o sin precio. */
  procedureCount: number;
  /** Tratamientos de la atención: el propio y los de sus procedimientos planificados. */
  treatments: TreatmentSnapshot[];
}

export interface ProposalTreatment {
  id: string;
  title: string | null;
  status: string;
  currency: string | null;
  /** `null` sin presupuesto. */
  balanceMinor: number | null;
  /** Admite cobros: con presupuesto y no rechazado ni cancelado. */
  payable: boolean;
  /** Monto propuesto si se cobra a este tratamiento; `null` si no aplica. */
  suggestedAmountMinor: number | null;
}

/**
 * Propuesta de cobro de una atención. Solo es una sugerencia: recepción la
 * confirma, la edita al monto realmente recibido o la omite (prórroga).
 */
export interface PaymentProposal {
  encounterId: string;
  /** Falta cobrar: no está anulada y no tiene un pago vigente. */
  collectable: boolean;
  activePaymentId: string | null;
  procedureCount: number;
  pricedProcedureCount: number;
  proceduresTotalMinor: number | null;
  currency: string | null;
  treatments: ProposalTreatment[];
  suggestedTreatmentId: string | null;
  suggestedAmountMinor: number | null;
}
