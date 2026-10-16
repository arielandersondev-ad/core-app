import { type KeyObject } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { jwtVerify, type JWTPayload } from 'jose';
import type { DentistryPrincipal } from '../../application/contracts/dentistry-principal.js';
import { loadJwtPublicKey } from './jwt-public-key.loader.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERMISSION = /^dentistry:[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+$/;

function uuidClaim(payload: JWTPayload, claim: string): string {
  const value = payload[claim];
  if (typeof value !== 'string' || !UUID.test(value)) {
    throw new Error(`Claim JWT inválido: ${claim}`);
  }
  return value;
}

function stringArrayClaim(payload: JWTPayload, claim: string, pattern: RegExp): string[] {
  const value = payload[claim];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !pattern.test(item))) {
    throw new Error(`Claim JWT inválido: ${claim}`);
  }
  return [...new Set(value)];
}

@Injectable()
export class DentistryTokenVerifier {
  private readonly publicKey: KeyObject = loadJwtPublicKey();
  private readonly issuer = process.env['JWT_ISSUER'] ?? 'core-auth';
  private readonly audience = process.env['JWT_DENTISTRY_AUDIENCE'] ?? 'dentistry-api';

  async verify(token: string): Promise<DentistryPrincipal> {
    const { payload, protectedHeader } = await jwtVerify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: this.issuer,
      audience: this.audience,
    });
    if (protectedHeader.typ !== 'at+jwt' || typeof protectedHeader.kid !== 'string' || !protectedHeader.kid) {
      throw new Error('Header JWT inválido');
    }
    if (payload.aud !== this.audience) {
      throw new Error('El token debe tener una sola audiencia Dentistry');
    }
    if (typeof payload.iat !== 'number' || typeof payload.exp !== 'number' || payload.exp <= payload.iat || payload.exp - payload.iat > 900) {
      throw new Error('Vigencia JWT inválida');
    }
    uuidClaim(payload, 'jti');
    return {
      sub: uuidClaim(payload, 'sub'),
      membershipId: uuidClaim(payload, 'membershipId'),
      organizationId: uuidClaim(payload, 'organizationId'),
      branchIds: stringArrayClaim(payload, 'branchIds', UUID),
      permissions: stringArrayClaim(payload, 'permissions', PERMISSION),
    };
  }
}
