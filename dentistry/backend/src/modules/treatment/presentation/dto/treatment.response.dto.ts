import type {
  TreatmentStatus,
  TreatmentWithBalance,
} from '../../domain/entities/treatment.entity.js';

export class TreatmentResponseDto {
  id: string;
  patientId: string;
  serviceId: string | null;
  serviceName: string | null;
  practitionerMembershipId: string | null;
  status: TreatmentStatus;
  startedAt: string | null;
  endedAt: string | null;
  estimatedSessions: number | null;
  agreedPriceMinor: number | null;
  currency: string | null;
  /** Dinero recibido (pagos COMPLETED) en unidades menores. */
  paidMinor: number;
  /** Presupuesto − recibido; `null` si aún no hay presupuesto. */
  balanceMinor: number | null;
  diagnosisSummary: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  static fromEntity(treatment: TreatmentWithBalance): TreatmentResponseDto {
    return {
      id: treatment.id,
      patientId: treatment.patientId,
      serviceId: treatment.serviceId,
      serviceName: treatment.serviceName,
      practitionerMembershipId: treatment.practitionerMembershipId,
      status: treatment.status,
      startedAt: treatment.startedAt?.toISOString() ?? null,
      endedAt: treatment.endedAt?.toISOString() ?? null,
      estimatedSessions: treatment.estimatedSessions,
      agreedPriceMinor: treatment.agreedPriceMinor,
      currency: treatment.currency,
      paidMinor: treatment.paidMinor,
      balanceMinor: treatment.balanceMinor,
      diagnosisSummary: treatment.diagnosisSummary,
      notes: treatment.notes,
      createdAt: treatment.createdAt.toISOString(),
      updatedAt: treatment.updatedAt.toISOString(),
    };
  }
}
