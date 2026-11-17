import { ApiError } from "@/infrastructure/http/api-error";

export type PatientQuota = {
  /** Pacientes no eliminados de la organización. */
  used: number;
  /** null: el plan no define cupo de pacientes. */
  limit: number | null;
};

export const PATIENT_LIMIT_MESSAGE =
  "Llegaste al máximo de pacientes de tu plan. Mejora tu plan para agregar más.";

export function isPatientLimitReached(quota: PatientQuota | undefined): boolean {
  return quota !== undefined && quota.limit !== null && quota.used >= quota.limit;
}

/** "N / 300"; null cuando el plan no tiene cupo o aún no se conoce. */
export function patientQuotaLabel(quota: PatientQuota | undefined): string | null {
  return quota && quota.limit !== null ? `${quota.used} / ${quota.limit}` : null;
}

/** El backend rechazó el alta por cupo (p. ej. dos usuarios creando a la vez). */
export function isPlanLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED";
}
