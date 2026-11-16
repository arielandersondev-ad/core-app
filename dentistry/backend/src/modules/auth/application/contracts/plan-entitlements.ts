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
] as const;

export type DentistryModule = (typeof DENTISTRY_MODULES)[number];

export type PlanLimits = {
  patients: number | null;
  users: number | null;
  branches: number | null;
};

/**
 * Entitlements of the organization's current Dentistry plan.
 * `modules: null` means the snapshot predates module gating: every module is enabled.
 * A null limit means unlimited.
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

/** Parses a stored snapshot defensively; unknown module codes are ignored. */
export function parsePlanEntitlements(snapshot: unknown): PlanEntitlements {
  const object = isObject(snapshot) ? snapshot : {};
  const modules = Array.isArray(object.modules)
    ? DENTISTRY_MODULES.filter((code) => (object.modules as unknown[]).includes(code))
    : null;
  return {
    modules,
    limits: {
      patients: readLimit(object.limits, 'patients'),
      users: readLimit(object.limits, 'users'),
      branches: readLimit(object.limits, 'branches'),
    },
  };
}
