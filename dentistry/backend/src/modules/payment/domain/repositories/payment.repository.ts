import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type {
  EncounterSnapshot,
  Payment,
  PaymentStatus,
  TreatmentSnapshot,
} from '../entities/payment.entity.js';

export type PaymentScope = { organizationId: string; patientId: string };

export type FindPaymentsFilters = PaymentScope & {
  authorizedBranchIds: string[];
  treatmentId?: string;
  status?: PaymentStatus;
  page?: number;
  pageSize?: number;
};

/** Datos de inserción ya validados por las reglas de dominio. */
export type PaymentInsert = Omit<
  Payment,
  | 'id'
  | 'status'
  | 'voidedAt'
  | 'voidedByMembershipId'
  | 'voidReason'
  | 'createdAt'
  | 'updatedAt'
>;

/**
 * Estado leído bajo bloqueo justo antes de insertar. `treatment` y
 * `encounter` son `null` cuando se pidieron y no existen en el alcance.
 */
export type RegistrationContext = {
  treatment: TreatmentSnapshot | null;
  encounter: EncounterSnapshot | null;
};

/**
 * `treatmentId` explícito tiene prioridad; si no hay y el pago es de una
 * atención, se usa el tratamiento de la atención. Sin ninguno, no hay tratamiento.
 */
export type RegistrationRequest = PaymentScope & {
  treatmentId: string | null;
  encounterId: string | null;
};

export type VoidData = {
  voidedAt: Date;
  voidedByMembershipId: string;
  voidReason: string;
};

export abstract class PaymentRepository {
  abstract findPage(
    filters: FindPaymentsFilters,
  ): Promise<PaginatedResult<Payment>>;

  abstract findById(scope: PaymentScope, id: string): Promise<Payment | null>;

  /** Pago COMPLETED vigente de una atención del paciente, si existe. */
  abstract findActiveByEncounter(
    scope: PaymentScope,
    encounterId: string,
  ): Promise<Payment | null>;

  /** El tratamiento y todos sus pagos (también los anulados), por fecha. */
  abstract findAccount(
    scope: PaymentScope,
    treatmentId: string,
  ): Promise<{ treatment: TreatmentSnapshot; payments: Payment[] } | null>;

  /**
   * Bloquea la atención y el tratamiento, lee su estado, aplica `decide` y
   * guarda el pago en la misma transacción. Así dos cobros simultáneos no
   * superan el saldo ni duplican el pago de una atención.
   */
  abstract register(
    request: RegistrationRequest,
    decide: (context: RegistrationContext) => PaymentInsert,
  ): Promise<Payment>;

  /** Anula solo un pago COMPLETED; `null` si no existe o ya estaba anulado. */
  abstract void(
    scope: PaymentScope,
    id: string,
    data: VoidData,
  ): Promise<Payment | null>;
}
