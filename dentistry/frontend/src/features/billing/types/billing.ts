export type TreatmentStatus =
  | "PROPOSED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELED";

export type PaymentMethod = "CASH" | "TRANSFER" | "QR" | "CARD";
export type PaymentStatus = "COMPLETED" | "VOIDED";

/** Importes siempre en unidades menores enteras (200 Bs = 20000). */
export interface Treatment {
  id: string;
  patientId: string;
  title: string | null;
  serviceName: string | null;
  status: TreatmentStatus;
  agreedPriceMinor: number | null;
  currency: string | null;
  /** Dinero recibido; el saldo es presupuesto − recibido. */
  paidMinor: number;
  balanceMinor: number | null;
  diagnosisSummary: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Payment {
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
  voidedAt: string | null;
  voidReason: string | null;
}

export interface AccountMovement extends Payment {
  /** Saldo tras este pago; `null` si está anulado o no hay presupuesto. */
  runningBalanceMinor: number | null;
}

export interface TreatmentAccount {
  treatment: {
    id: string;
    title: string | null;
    status: TreatmentStatus;
    agreedPriceMinor: number | null;
    currency: string | null;
  };
  paidMinor: number;
  balanceMinor: number | null;
  movements: AccountMovement[];
}

export interface ProposalTreatment {
  id: string;
  title: string | null;
  status: TreatmentStatus;
  currency: string | null;
  balanceMinor: number | null;
  payable: boolean;
  suggestedAmountMinor: number | null;
}

/** Sugerencia de cobro al finalizar una atención; recepción la confirma, edita u omite. */
export interface PaymentProposal {
  encounterId: string;
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

export interface CreateTreatmentInput {
  title: string;
  agreedPriceMinor?: number;
  currency?: string;
  diagnosisSummary?: string | null;
  notes?: string | null;
}

export interface UpdateTreatmentInput {
  title?: string;
  status?: TreatmentStatus;
  agreedPriceMinor?: number | null;
  currency?: string | null;
}

export interface RegisterPaymentInput {
  amountMinor: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  /** Instante ISO; si se omite, el backend usa la hora actual. */
  paidAt?: string;
  reference?: string | null;
  notes?: string | null;
  branchId?: string;
}

export interface RegisterEncounterPaymentInput extends Omit<RegisterPaymentInput, "branchId"> {
  /** Tratamiento que reduce el pago; por defecto, el de la atención. */
  treatmentId?: string;
}
