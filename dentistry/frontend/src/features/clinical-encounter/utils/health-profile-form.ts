import type {
  PatientHealthProfile,
  PatientHealthProfileInput,
} from "@/features/clinical-encounter/types/clinical-encounter";

export type HealthProfileFieldKey =
  | "medicalHistory"
  | "allergies"
  | "currentMedications"
  | "dentalHistory"
  | "relevantConditions"
  | "observations";

export interface HealthProfileDraft {
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  dentalHistory: string;
  relevantConditions: string;
  observations: string;
}

export interface HealthProfileFieldDefinition {
  key: HealthProfileFieldKey;
  label: string;
  hint?: string;
}

/**
 * Definición única de los seis textos del perfil. El orden se reutiliza tanto
 * en lectura como en edición para no duplicar literales en la vista.
 */
export const HEALTH_PROFILE_FIELDS: HealthProfileFieldDefinition[] = [
  {
    key: "medicalHistory",
    label: "Antecedentes médicos",
    hint: "Enfermedades sistémicas, cirugías y hospitalizaciones.",
  },
  {
    key: "allergies",
    label: "Alergias",
    hint: "Medicamentos, látex, anestésicos u otras.",
  },
  {
    key: "currentMedications",
    label: "Medicación actual",
    hint: "Nombre, dosis y frecuencia.",
  },
  {
    key: "dentalHistory",
    label: "Antecedentes odontológicos",
    hint: "Tratamientos previos relevantes.",
  },
  {
    key: "relevantConditions",
    label: "Condiciones relevantes",
    hint: "Bruxismo, sensibilidad, hábitos.",
  },
  {
    key: "observations",
    label: "Observaciones",
    hint: "Notas generales del perfil.",
  },
];

export const HEALTH_PROFILE_READ_PERMISSION = "dentistry:encounters:read";
export const HEALTH_PROFILE_UPDATE_PERMISSION = "dentistry:encounters:update";

/** El perfil contiene datos clínicos: leerlo exige permiso de atenciones. */
export function canReadHealthProfile(permissions: readonly string[]): boolean {
  return permissions.includes(HEALTH_PROFILE_READ_PERMISSION);
}

/** Editar el perfil exige el permiso clínico de actualización de atenciones. */
export function canEditHealthProfile(permissions: readonly string[]): boolean {
  return permissions.includes(HEALTH_PROFILE_UPDATE_PERMISSION);
}

function toDraftValue(value: string | null | undefined): string {
  return value ?? "";
}

function toInputValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Convierte el perfil guardado en un borrador editable (`null` → `""`). */
export function toHealthProfileDraft(profile: PatientHealthProfile): HealthProfileDraft {
  return {
    medicalHistory: toDraftValue(profile.medicalHistory),
    allergies: toDraftValue(profile.allergies),
    currentMedications: toDraftValue(profile.currentMedications),
    dentalHistory: toDraftValue(profile.dentalHistory),
    relevantConditions: toDraftValue(profile.relevantConditions),
    observations: toDraftValue(profile.observations),
  };
}

/**
 * Normaliza el borrador antes de guardarlo: los textos vacíos o con solo
 * espacios se envían como `null` y los no vacíos se recortan.
 */
export function toHealthProfileInput(draft: HealthProfileDraft): PatientHealthProfileInput {
  return {
    medicalHistory: toInputValue(draft.medicalHistory),
    allergies: toInputValue(draft.allergies),
    currentMedications: toInputValue(draft.currentMedications),
    dentalHistory: toInputValue(draft.dentalHistory),
    relevantConditions: toInputValue(draft.relevantConditions),
    observations: toInputValue(draft.observations),
  };
}

/** Compara el borrador con el perfil guardado usando la misma normalización. */
export function isDraftDirty(draft: HealthProfileDraft, profile: PatientHealthProfile): boolean {
  const current = toHealthProfileInput(draft);
  const saved = toHealthProfileInput(toHealthProfileDraft(profile));

  return HEALTH_PROFILE_FIELDS.some((field) => current[field.key] !== saved[field.key]);
}

/**
 * Indica si el borrador debe reiniciarse al cambiar la versión del perfil
 * guardado. Un refetch con la misma versión conserva los cambios locales.
 */
export function shouldResetDraft(
  currentSource: string | null,
  profileVersion: string | null,
): boolean {
  if (profileVersion === null) return false;
  return currentSource !== profileVersion;
}
