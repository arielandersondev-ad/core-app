import type {
  ClinicalEncounter,
  ClinicalEncounterListFilters,
  ClinicalEncounterProcedure,
  ClinicalEncounterStatus,
} from "@/features/clinical-encounter/types/clinical-encounter";

/** Valor de UI que representa "todas las atenciones" y nunca viaja a la API. */
export const ALL_ENCOUNTER_STATUSES = "ALL" as const;

export type EncounterStatusFilter = ClinicalEncounterStatus | typeof ALL_ENCOUNTER_STATUSES;

export interface EncounterFilterState {
  status?: EncounterStatusFilter;
  search?: string;
}

/**
 * Normaliza el texto de búsqueda: recorta extremos y colapsa espacios internos
 * para que "  dolor   leve " y "dolor leve" produzcan la misma query.
 */
export function normalizeSearch(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Construye el filtro que consume el contrato de listado. Omite valores vacíos
 * (incluido el estado "ALL") y no inventa `page` ni `pageSize`.
 */
export function buildListFilters({
  status = ALL_ENCOUNTER_STATUSES,
  search = "",
}: EncounterFilterState): ClinicalEncounterListFilters {
  const filters: ClinicalEncounterListFilters = {};

  if (status !== ALL_ENCOUNTER_STATUSES) {
    filters.status = status;
  }

  const normalized = normalizeSearch(search);
  if (normalized) {
    filters.search = normalized;
  }

  return filters;
}

/** Indica si el usuario tiene algún filtro activo (para distinguir vacíos). */
export function hasActiveListFilters(state: EncounterFilterState): boolean {
  return Object.keys(buildListFilters(state)).length > 0;
}

type EncounterSummarySource = Pick<
  ClinicalEncounter,
  "chiefComplaint" | "examinationSummary" | "procedureSummary"
>;

/**
 * Texto de apoyo de una atención: motivo de consulta, resumen del examen o,
 * como último recurso, el resumen de procedimientos.
 */
export function describeEncounterSubtitle(encounter: EncounterSummarySource): string {
  return (
    normalizeSearch(encounter.chiefComplaint ?? "") ||
    normalizeSearch(encounter.examinationSummary ?? "") ||
    normalizeSearch(encounter.procedureSummary ?? "")
  );
}

/** Recorta un texto a la longitud máxima y añade elipsis. */
export function truncateText(value: string, maxLength = 120): string {
  const normalized = normalizeSearch(value);
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

/** Procedimientos vigentes (no anulados) de una atención. */
export function countRecordedProcedures(procedures: readonly ClinicalEncounterProcedure[]): number {
  return procedures.filter((procedure) => procedure.status === "RECORDED").length;
}

/** Etiqueta pluralizada del número de procedimientos. */
export function formatProcedureCount(count: number): string {
  if (count <= 0) return "Sin procedimientos";
  return count === 1 ? "1 procedimiento" : `${count} procedimientos`;
}
