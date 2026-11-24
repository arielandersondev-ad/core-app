import type {
  Treatment,
  TreatmentStatus,
  TreatmentWithBalance,
} from '../domain/entities/treatment.entity.js';

export interface TreatmentRow {
  id: string;
  organizationId: string;
  patientId: string;
  serviceId: string | null;
  title: string | null;
  practitionerMembershipId: string | null;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  estimatedSessions: number | null;
  agreedPriceMinor: number | null;
  currency: string | null;
  diagnosisSummary: string | null;
  notes: string | null;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentAmountRow {
  treatmentId: string | null;
  amountMinor: number;
}

export function toTreatmentEntity(
  row: TreatmentRow,
  serviceNames: Map<string, string>,
): Treatment {
  return {
    id: row.id,
    organizationId: row.organizationId,
    patientId: row.patientId,
    serviceId: row.serviceId,
    serviceName: row.serviceId ? (serviceNames.get(row.serviceId) ?? null) : null,
    title: row.title,
    practitionerMembershipId: row.practitionerMembershipId,
    status: row.status as TreatmentStatus,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    estimatedSessions: row.estimatedSessions,
    agreedPriceMinor: row.agreedPriceMinor,
    currency: row.currency,
    diagnosisSummary: row.diagnosisSummary,
    notes: row.notes,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Suma el dinero recibido por tratamiento. Los pagos anulados no llegan aquí. */
export function sumPaidByTreatment(
  payments: PaymentAmountRow[],
): Map<string, number> {
  const paid = new Map<string, number>();
  for (const payment of payments) {
    if (payment.treatmentId === null) continue;
    paid.set(
      payment.treatmentId,
      (paid.get(payment.treatmentId) ?? 0) + payment.amountMinor,
    );
  }
  return paid;
}

/** Saldo = presupuesto − recibido; nulo mientras no exista presupuesto. */
export function withBalance(
  treatment: Treatment,
  paidMinor: number,
): TreatmentWithBalance {
  return {
    ...treatment,
    paidMinor,
    balanceMinor:
      treatment.agreedPriceMinor === null
        ? null
        : treatment.agreedPriceMinor - paidMinor,
  };
}
