import { createPublicKey, type KeyObject } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { jwtVerify, type JWTPayload } from 'jose';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.js';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import { loadJwtKey } from './jwt-key.loader.js';

const UUID_PATTERN =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

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
    this.audience = process.env['JWT_AUDIENCE'] ?? 'core-services';
  }

  async verify(token: string): Promise<AuthenticatedPrincipal> {
    const { payload } = await jwtVerify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
    });

    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number') {
      throw new Error('El token debe incluir iat y exp');
    }

    const email = requiredString(payload, 'email');
    const sub = payload.sub;
    if (typeof sub !== 'string' || !UUID_PATTERN.test(sub)) {
      throw new Error('Claim JWT inválido: sub');
    }

    return {
      sub,
      email,
      membershipId: requiredUuid(payload, 'membershipId'),
      organizationId: requiredUuid(payload, 'organizationId'),
      branchIds: requiredStringArray(payload, 'branchIds', UUID_PATTERN),
      roleCodes: requiredStringArray(payload, 'roleCodes', ROLE_CODE_PATTERN),
    };
  }
}
