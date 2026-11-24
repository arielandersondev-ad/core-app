import { BadRequestException } from '@nestjs/common';
import type { JsonValue } from './entities/plan.entity.js';

export type VersionedEntitlements = { [key: string]: JsonValue } & {
  schemaVersion: number;
};

/**
 * Well-known keys of a versioned snapshot (packages/db target-schema-dictionary §7.1):
 * - `features`: capability flags; only a `true` flag enables the capability.
 * - `limits`: positive integer quotas (`patients`, `members`, `branches`).
 * - File quotas (`fileStorageBytes`, `filesPerPatient`): required only when
 *   `features.files` is enabled; an absent quota is invalid, not unlimited.
 * Any other key is preserved untouched.
 */
export const ENTITLEMENT_LIMIT_KEYS = ['patients', 'members', 'branches'] as const;
export const FILE_LIMIT_KEYS = ['fileStorageBytes', 'filesPerPatient'] as const;
export type EntitlementLimitKey = (typeof ENTITLEMENT_LIMIT_KEYS)[number];
const FEATURE_CODE = /^[a-z][A-Za-z0-9]{0,49}$/;

type JsonObject = { readonly [key: string]: JsonValue };

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

function assertFeatures(value: JsonValue | undefined): void {
  if (value === undefined) return;
  if (
    !isJsonObject(value) ||
    Object.entries(value).some(
      ([code, enabled]) => !FEATURE_CODE.test(code) || typeof enabled !== 'boolean',
    )
  ) {
    throw new BadRequestException(
      'entitlements.features debe ser un objeto de funciones con valores booleanos',
    );
  }
}

function assertLimits(value: JsonValue | undefined): void {
  if (value === undefined) return;
  if (!isJsonObject(value)) {
    throw new BadRequestException('entitlements.limits debe ser un objeto JSON');
  }
  for (const key of [...ENTITLEMENT_LIMIT_KEYS, ...FILE_LIMIT_KEYS]) {
    const limit = value[key];
    if (limit === undefined || limit === null) continue;
    if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1) {
      throw new BadRequestException(
        `entitlements.limits.${key} debe ser un entero positivo`,
      );
    }
  }
}

/** Accept the existing catalog payloads while writing only versioned objects. */
export function normalizeEntitlements(value: unknown): VersionedEntitlements {
  if (value === null || Array.isArray(value) || typeof value !== 'object') {
    throw new BadRequestException('entitlements debe ser un objeto JSON');
  }
  const object = value as { [key: string]: JsonValue };
  const schemaVersion = 'schemaVersion' in object ? object.schemaVersion : 1;
  if (
    typeof schemaVersion !== 'number' ||
    !Number.isSafeInteger(schemaVersion) ||
    schemaVersion < 1
  ) {
    throw new BadRequestException(
      'entitlements.schemaVersion debe ser un entero positivo',
    );
  }
  assertFeatures(object.features);
  assertLimits(object.limits);
  return { ...object, schemaVersion };
}

/**
 * Catalog writes must be complete: an unknown limit is invalid, not unlimited.
 * Stored snapshots that predate this rule are still read (missing limit = no quota).
 */
export function normalizeCatalogEntitlements(value: unknown): VersionedEntitlements {
  const entitlements = normalizeEntitlements(value);
  if (!isJsonObject(entitlements.features)) {
    throw new BadRequestException('entitlements.features es obligatorio');
  }
  const limits = isJsonObject(entitlements.limits) ? entitlements.limits : {};
  const required = entitlements.features.files === true
    ? [...ENTITLEMENT_LIMIT_KEYS, ...FILE_LIMIT_KEYS]
    : ENTITLEMENT_LIMIT_KEYS;
  for (const key of required) {
    if (typeof limits[key] !== 'number') {
      throw new BadRequestException(`entitlements.limits.${key} es obligatorio`);
    }
  }
  return entitlements;
}

/** Reads a quota from a stored snapshot; null means unlimited. */
export function readEntitlementLimit(
  snapshot: JsonValue | undefined,
  key: EntitlementLimitKey,
): number | null {
  if (!isJsonObject(snapshot)) return null;
  const limits = snapshot.limits;
  if (!isJsonObject(limits)) return null;
  const limit = limits[key];
  return typeof limit === 'number' && Number.isSafeInteger(limit) && limit > 0 ? limit : null;
}
