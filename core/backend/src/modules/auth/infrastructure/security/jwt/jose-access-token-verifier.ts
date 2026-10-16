import { createPublicKey, type KeyObject } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { jwtVerify, type JWTPayload } from 'jose';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.js';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import { loadJwtKey } from './jwt-key.loader.js';
import { UUID_PATTERN } from '../../../../../common/validation/uuid-pattern.js';
import { TOKEN_AUDIENCES } from '../../../application/contracts/token-audience.js';

function requiredString(payload: JWTPayload, claim: string): string {
  const value = payload[claim];
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Claim JWT inválido: ${claim}`);
  }
  return value;
}

function requiredUuid(payload: JWTPayload, claim: string): string {
  const value = requiredString(payload, claim);
  if (!UUID_PATTERN.test(value)) {
    throw new Error(`Claim JWT inválido: ${claim}`);
  }
  return value;
}

function requiredStringArray(
  payload: JWTPayload,
  claim: string,
  pattern: RegExp,
): string[] {
  const value = payload[claim];
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' || !pattern.test(item))
  ) {
    throw new Error(`Claim JWT inválido: ${claim}`);
  }
  return [...new Set(value)];
}

@Injectable()
export class JoseAccessTokenVerifier extends AccessTokenVerifier {
  private readonly publicKey: KeyObject;
  private readonly issuer: string;
  private readonly audience: string;

  constructor() {
    super();
    this.publicKey = loadJwtKey(
      'JWT_PUBLIC_KEY_PATH',
      'secrets/jwt-public.pem',
      (pem) => createPublicKey(pem),
    );
    this.issuer = process.env['JWT_ISSUER'] ?? 'core-auth';
    this.audience = process.env['JWT_CORE_AUDIENCE'] ?? 'core-api';
    if (this.audience !== TOKEN_AUDIENCES.core) {
      throw new Error('JWT_CORE_AUDIENCE debe ser core-api');
    }
  }

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    const { payload, protectedHeader } = await jwtVerify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
    });

    if (protectedHeader.typ !== 'at+jwt') {
      throw new Error('Tipo de token inválido');
    }

    if (payload.aud !== TOKEN_AUDIENCES.core) {
      throw new Error('El token debe tener una única audiencia core-api');
    }

    const issuedAt = payload.iat;
    const expiresAt = payload.exp;
    if (typeof issuedAt !== 'number' || typeof expiresAt !== 'number' ||
      !Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt) ||
      expiresAt <= issuedAt || expiresAt - issuedAt > 900) {
      throw new Error('Vigencia del token inválida');
    }

    requiredUuid(payload, 'jti');
    const sub = payload.sub;
    if (typeof sub !== 'string' || !UUID_PATTERN.test(sub)) {
      throw new Error('Claim JWT inválido: sub');
    }

    return {
      sub,
      membershipId: requiredUuid(payload, 'membershipId'),
      organizationId: requiredUuid(payload, 'organizationId'),
      branchIds: requiredStringArray(payload, 'branchIds', UUID_PATTERN),
      permissions: requiredStringArray(payload, 'permissions', /^(?!dentistry:)[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+$/),
    };
  }
}
