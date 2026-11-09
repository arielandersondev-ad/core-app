import type {
  ClinicalEncounterProcedureDraft,
  CreateClinicalEncounterInput,
  EncounterReferenceOption,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { buildInstant } from "@/features/clinical-encounter/utils/dates";
import { targetTypeLabels } from "@/features/clinical-encounter/utils/procedures";

export interface CreateEncounterFormValues {
  branchId: string;
  appointmentId: string;
  treatmentId: string;
  startDate: string;
  startTime: string;
  chiefComplaint: string;
  examinationSummary: string;
  diagnosisSummary: string;
  notes: string;
  patientInstructions: string;
  progressNotes: string;
  procedures: ClinicalEncounterProcedureDraft[];
}

export type CreateEncounterValidationResult =
  | { input: CreateClinicalEncounterInput }
  | { error: string; field: "branchId" | "startedAt" };

/**
 * Estado inicial del formulario. La fecha y la hora quedan vacías para que el
 * helper sea puro; la vista las completa con `nowDateValue`/`nowTimeValue`.
 */
export function emptyCreateForm(): CreateEncounterFormValues {
  return {
    branchId: "",
    appointmentId: "",
    treatmentId: "",
    startDate: "",
    startTime: "",
    chiefComplaint: "",
    examinationSummary: "",
    diagnosisSummary: "",
    notes: "",
    patientInstructions: "",
    progressNotes: "",
    procedures: [],
  };
}

function normalizeText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeOptionalId(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Convierte los valores del formulario en el contrato de creación. Valida la
 * sucursal y el instante de inicio, y normaliza los textos vacíos a `null`.
 */
export function toCreateInput(
  values: CreateEncounterFormValues,
  patientId: string,
): CreateEncounterValidationResult {
  const branchId = values.branchId.trim();
  if (!branchId) {
    return {
      error: "Selecciona una sucursal para registrar la atención.",
      field: "branchId",
    };
  }

  const startedAt = buildInstant(values.startDate, values.startTime);
  if (!startedAt) {
    return {
      error: "Indica una fecha y una hora de inicio válidas.",
      field: "startedAt",
    };
  }

  return {
    input: {
      patientId,
      branchId,
      appointmentId: normalizeOptionalId(values.appointmentId),
      treatmentId: normalizeOptionalId(values.treatmentId),
      startedAt,
      chiefComplaint: normalizeText(values.chiefComplaint),
      examinationSummary: normalizeText(values.examinationSummary),
      diagnosisSummary: normalizeText(values.diagnosisSummary),
      notes: normalizeText(values.notes),
      patientInstructions: normalizeText(values.patientInstructions),
      progressNotes: normalizeText(values.progressNotes),
    },
  };
}

function procedureKey(procedure: ClinicalEncounterProcedureDraft): string {
  return [
    procedure.targetType,
    procedure.toothNumber ?? "",
    procedure.targetDescription ?? "",
    procedure.description,
    procedure.treatmentProcedureId ?? "",
  ].join("|");
}

/**
 * Concatena los procedimientos nuevos y descarta los duplicados exactos contra
 * la lista actual y dentro del propio lote entrante.
 */
export function appendProcedure(
  current: ClinicalEncounterProcedureDraft[],
  next: ClinicalEncounterProcedureDraft[],
): ClinicalEncounterProcedureDraft[] {
  const seen = new Set(current.map(procedureKey));
  const result = [...current];

  for (const procedure of next) {
    const key = procedureKey(procedure);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(procedure);
  }

  return result;
}

export function removeProcedureAt(
  current: ClinicalEncounterProcedureDraft[],
  index: number,
): ClinicalEncounterProcedureDraft[] {
  return current.filter((_, currentIndex) => currentIndex !== index);
}

/**
 * Texto legible para la lista de procedimientos: objetivo + descripción.
 */
export function describeProcedure(procedure: ClinicalEncounterProcedureDraft): string {
  const target =
    procedure.targetType === "TOOTH"
      ? procedure.toothNumber
        ? `Pieza ${procedure.toothNumber}`
        : targetTypeLabels.TOOTH
      : procedure.targetDescription?.trim() || targetTypeLabels[procedure.targetType];

  return `${target} · ${procedure.description}`;
}

/**
 * El contrato de referencia actual no publica la relación cita → tratamiento.
 * Si en el futuro la opción la incluye, se sugiere; nunca se inventa un plan.
 */
export function suggestedTreatmentId(
  appointmentId: string,
  appointments: EncounterReferenceOption[],
): string | null {
  if (!appointmentId) return null;

  const option = appointments.find((item) => item.id === appointmentId) as
    | (EncounterReferenceOption & { treatmentId?: unknown })
    | undefined;
  const treatmentId = option?.treatmentId;

  return typeof treatmentId === "string" && treatmentId.trim() ? treatmentId : null;
}
