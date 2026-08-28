import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { KeyObject } from 'node:crypto';

export function loadJwtKey(
  envVar: string,
  fallback: string,
  factory: (pem: string) => KeyObject,
): KeyObject {
  const path = process.env[envVar] ?? fallback;

  try {
    return factory(readFileSync(resolve(path), 'utf8'));
  } catch {
    throw new Error(
      `No se encontró una clave JWT válida en "${path}". ` +
        'Genera las claves RS256 con: node scripts/gen-jwt-keys.mjs',
    );
  }
}
