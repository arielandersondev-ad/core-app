import { BadRequestException } from '@nestjs/common';
import type { JsonValue } from './entities/plan.entity.js';

export type VersionedEntitlements = { [key: string]: JsonValue } & {
  schemaVersion: number;
};

/**
 * Optional, well-known keys of a versioned snapshot:
 * - `modules`: module codes the plan enables. Absent means no restriction
 *   (snapshots created before module gating keep every module).
 * - `limits`: positive integer quotas; an absent or null value means unlimited.
 * Any other key is preserved untouched.
 */
export const ENTITLEMENT_LIMIT_KEYS = ['patients', 'users', 'branches'] as const;
const MODULE_CODE = /^[a-z][a-z0-9-]{0,49}$/;

type JsonObject = { readonly [key: string]: JsonValue };

function isJsonObject(value: JsonValue | undefined): value is JsonObject {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

function assertModules(value: JsonValue | undefined): void {
  if (value === undefined) return;
  if (
    !Array.isArray(value) ||
    value.some((code) => typeof code !== 'string' || !MODULE_CODE.test(code)) ||
    new Set(value).size !== value.length
  ) {
    throw new BadRequestException(
      'entitlements.modules debe ser una lista de códigos de módulo únicos',
    );
  }
}

function assertLimits(value: JsonValue | undefined): void {
  if (value === undefined) return;
  if (!isJsonObject(value)) {
    throw new BadRequestException('entitlements.limits debe ser un objeto JSON');
  }
  for (const key of ENTITLEMENT_LIMIT_KEYS) {
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
  assertModules(object.modules);
  assertLimits(object.limits);
  return { ...object, schemaVersion };
}

/** Reads a quota from a stored snapshot; null means unlimited. */
export function readEntitlementLimit(
  snapshot: JsonValue | undefined,
  key: (typeof ENTITLEMENT_LIMIT_KEYS)[number],
): number | null {
  if (!isJsonObject(snapshot)) return null;
  const limits = snapshot.limits;
  if (!isJsonObject(limits)) return null;
  const limit = limits[key];
  return typeof limit === 'number' && Number.isSafeInteger(limit) && limit > 0 ? limit : null;
}
