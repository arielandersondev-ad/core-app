import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type {
  TreatmentStatus,
  TreatmentWithBalance,
} from '../entities/treatment.entity.js';

export type TreatmentScope = { organizationId: string; patientId: string };

export type FindTreatmentsFilters = TreatmentScope & {
  status?: TreatmentStatus;
  page?: number;
  pageSize?: number;
};

export type TreatmentCreateData = TreatmentScope & {
  serviceId: string | null;
  practitionerMembershipId: string;
  estimatedSessions: number | null;
  agreedPriceMinor: number | null;
  currency: string | null;
  diagnosisSummary: string | null;
  notes: string | null;
  createdByMembershipId: string;
};

/** Cambio ya validado por las reglas de dominio; `undefined` = sin cambio. */
export type TreatmentChange = {
  status?: TreatmentStatus;
  startedAt?: Date | null;
  endedAt?: Date | null;
  estimatedSessions?: number | null;
  agreedPriceMinor?: number | null;
  currency?: string | null;
  diagnosisSummary?: string | null;
  notes?: string | null;
  updatedByMembershipId: string;
};

export abstract class TreatmentRepository {
  abstract findPage(
    filters: FindTreatmentsFilters,
  ): Promise<PaginatedResult<TreatmentWithBalance>>;

  abstract findById(
    scope: TreatmentScope,
    id: string,
  ): Promise<TreatmentWithBalance | null>;

  abstract serviceExists(
    organizationId: string,
    serviceId: string,
  ): Promise<boolean>;

  abstract create(data: TreatmentCreateData): Promise<TreatmentWithBalance>;

  /**
   * Lee el tratamiento y su dinero recibido bajo el bloqueo del tratamiento,
   * aplica `decide` y guarda el cambio en la misma transacción. Así un pago
   * simultáneo no puede dejar el presupuesto por debajo de lo ya cobrado.
   * Devuelve `null` si el tratamiento no existe en el alcance indicado.
   */
  abstract update(
    scope: TreatmentScope,
    id: string,
    decide: (current: TreatmentWithBalance) => TreatmentChange,
  ): Promise<TreatmentWithBalance | null>;
}
