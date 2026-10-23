import { BadRequestException } from '@nestjs/common';
import type { JsonValue } from './entities/plan.entity.js';

export type VersionedEntitlements = { [key: string]: JsonValue } & {
  schemaVersion: number;
};

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
  return { ...object, schemaVersion };
}
