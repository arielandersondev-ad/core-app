import type { ClinicalEncounterStatus } from "@/features/clinical-encounter/types/clinical-encounter";
import { isModuleEnabled, type SessionPlan } from "@/shared/plan/plan-access";

/** Estados del backend en los que una cita no admite atención. */
const NOT_ATTENDABLE = new Set(["CANCELED", "NO_SHOW"]);

/** Estados en español del modelo de vista de la agenda → estados del backend. */
const AGENDA_STATUS_TO_BACKEND: Record<string, string> = {
  programada: "SCHEDULED",
  confirmada: "CONFIRMED",
  en_sala: "WAITING_ROOM",
  en_curso: "IN_PROGRESS",
  completada: "COMPLETED",
  no_asistio: "NO_SHOW",
  cancelada: "CANCELED",
};

/** Acepta el estado del backend o el de la vista de agenda. */
export function toBackendAppointmentStatus(status: string): string {
  return AGENDA_STATUS_TO_BACKEND[status] ?? status;
}

export type AppointmentEncounterLookup =
  | { state: "pending" }
  /** Sin permiso de lectura no se puede saber; el backend rechaza el duplicado. */
  | { state: "unknown" }
  | { state: "ready"; encounter: { id: string; status: ClinicalEncounterStatus } | null };

export type AppointmentEncounterActions =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "existing"; encounterId: string; encounterStatus: ClinicalEncounterStatus; canView: boolean }
  | { kind: "available"; canAttend: boolean; canRegisterProcedure: boolean };

/**
 * Qué acciones clínicas ofrece una cita de la agenda:
 * - "Atender" abre la atención completa (función del plan `patients`).
 * - "Registrar procedimiento" registra una atención rápida (`procedures`).
 * - Con una atención ya vinculada solo se ofrece verla: una cita admite una.
 */
export function resolveAppointmentEncounterActions(input: {
  appointmentStatus: string;
  permissions: readonly string[];
  plan: SessionPlan | null;
  lookup: AppointmentEncounterLookup;
}): AppointmentEncounterActions {
  if (NOT_ATTENDABLE.has(toBackendAppointmentStatus(input.appointmentStatus))) return { kind: "hidden" };
  if (!isModuleEnabled(input.plan, "patients")) return { kind: "hidden" };

  if (input.lookup.state === "pending") return { kind: "loading" };
  if (input.lookup.state === "ready" && input.lookup.encounter) {
    return {
      kind: "existing",
      encounterId: input.lookup.encounter.id,
      encounterStatus: input.lookup.encounter.status,
      canView: input.permissions.includes("dentistry:encounters:read"),
    };
  }

  const canCreate = input.permissions.includes("dentistry:encounters:create");
  const actions = {
    kind: "available" as const,
    canAttend: canCreate,
    canRegisterProcedure: canCreate && isModuleEnabled(input.plan, "procedures"),
  };
  return actions.canAttend || actions.canRegisterProcedure ? actions : { kind: "hidden" };
}

export function newEncounterHref(patientId: string, appointmentId: string): string {
  return `/patients/${encodeURIComponent(patientId)}/clinical-encounters/new?appointmentId=${encodeURIComponent(appointmentId)}`;
}

export function encounterHref(patientId: string, encounterId: string): string {
  return `/patients/${encodeURIComponent(patientId)}/clinical-encounters/${encodeURIComponent(encounterId)}`;
}

export const ENCOUNTER_STATUS_LABELS: Record<ClinicalEncounterStatus, string> = {
  IN_PROGRESS: "Atención en curso",
  COMPLETED: "Atención completada",
  VOIDED: "Atención anulada",
};
