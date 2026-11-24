import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from '../domain/entities/payment.entity.js';

export interface PaymentRow {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  treatmentId: string | null;
  appointmentId: string | null;
  clinicalEncounterId: string | null;
  amountMinor: number;
  currency: string;
  paymentMethod: string;
  status: string;
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

export function toPaymentEntity(row: PaymentRow): Payment {
  return {
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    patientId: row.patientId,
    treatmentId: row.treatmentId,
    appointmentId: row.appointmentId,
    clinicalEncounterId: row.clinicalEncounterId,
    amountMinor: row.amountMinor,
    currency: row.currency,
    paymentMethod: row.paymentMethod as PaymentMethod,
    status: row.status as PaymentStatus,
    reference: row.reference,
    notes: row.notes,
    paidAt: row.paidAt,
    receivedByMembershipId: row.receivedByMembershipId,
    voidedAt: row.voidedAt,
    voidedByMembershipId: row.voidedByMembershipId,
    voidReason: row.voidReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Dinero recibido: solo cuentan los pagos COMPLETED. */
export function sumReceived(rows: Pick<PaymentRow, 'amountMinor' | 'status'>[]): number {
  return rows
    .filter((row) => row.status === 'COMPLETED')
    .reduce((total, row) => total + row.amountMinor, 0);
}
