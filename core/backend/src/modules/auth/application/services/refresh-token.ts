import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { UUID_PATTERN } from '../../../../common/validation/uuid-pattern.js';

const SECRET_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export type ParsedRefreshToken = { sessionId: string; secret: string };

export function generateRefreshSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function refreshHashMatches(secret: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashRefreshSecret(secret), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function formatRefreshToken(sessionId: string, secret: string): string {
  return `${sessionId}.${secret}`;
}

export function parseRefreshToken(token: unknown): ParsedRefreshToken | null {
  if (typeof token !== 'string' || token.length > 128) return null;
  const separator = token.indexOf('.');
  if (separator <= 0) return null;
  const sessionId = token.slice(0, separator);
  const secret = token.slice(separator + 1);
  if (!UUID_PATTERN.test(sessionId) || !SECRET_PATTERN.test(secret)) return null;
  return { sessionId: sessionId.toLowerCase(), secret };
}
