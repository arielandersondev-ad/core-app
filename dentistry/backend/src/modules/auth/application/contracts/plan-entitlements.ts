/** Module codes a Dentistry plan can enable (see core plan entitlements). */
export const DENTISTRY_MODULES = [
  'patients',
  'agenda',
  'appointments',
  'procedures',
  'inventory',
  'dashboard',
  'services',
  'treatments',
  'payments',
  'files',
] as const;

export type DentistryModule = (typeof DENTISTRY_MODULES)[number];

/**
 * Plan capability (`entitlements.features`, packages/db target-schema-dictionary §7.1)
 * that enables each module. Agenda and Citas share `appointments`; Paciente and
 * Historial clínico share `clinicalHistory`.
 */
export const MODULE_FEATURES: Readonly<Record<DentistryModule, string>> = {
  patients: 'clinicalHistory',
  agenda: 'appointments',
  appointments: 'appointments',
  procedures: 'procedureNotes',
  inventory: 'inventory',
  dashboard: 'dashboard',
  services: 'services',
  treatments: 'treatments',
  payments: 'payments',
  files: 'files',
};

export type PlanLimits = {
  patients: number | null;
  members: number | null;
  branches: number | null;
  /** Bytes totales de archivos clínicos de la organización (READY + reservas vigentes). */
  fileStorageBytes: number | null;
  /** Archivos clínicos por paciente (READY + reservas vigentes). */
  filesPerPatient: number | null;
};

/**
 * Entitlements of the organization's current Dentistry plan.
 * `modules: null` means the snapshot predates capability flags: every module is enabled.
 * A null limit means the snapshot predates that quota (not enforced).
 */
export type PlanEntitlements = {
  modules: DentistryModule[] | null;
  limits: PlanLimits;
};

export function isModuleEnabled(
  entitlements: PlanEntitlements,
  module: DentistryModule,
): boolean {
  return entitlements.modules === null || entitlements.modules.includes(module);
}

type JsonObject = { readonly [key: string]: unknown };

function isObject(value: unknown): value is JsonObject {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readLimit(limits: unknown, key: keyof PlanLimits): number | null {
  if (!isObject(limits)) return null;
  const value = limits[key];
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

/** Parses a stored snapshot defensively; only a feature set to `true` enables its modules. */
export function parsePlanEntitlements(snapshot: unknown): PlanEntitlements {
  const object = isObject(snapshot) ? snapshot : {};
  const features = object.features;
  const modules = isObject(features)
    ? DENTISTRY_MODULES.filter((code) => features[MODULE_FEATURES[code]] === true)
    : null;
  return {
    modules,
    limits: {
      patients: readLimit(object.limits, 'patients'),
      members: readLimit(object.limits, 'members'),
      branches: readLimit(object.limits, 'branches'),
      fileStorageBytes: readLimit(object.limits, 'fileStorageBytes'),
      filesPerPatient: readLimit(object.limits, 'filesPerPatient'),
    },
  };
}
