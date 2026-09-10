import { createPrivateKey, type KeyObject } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import { AccessTokenIssuer } from '../../../application/ports/access-token-issuer.js';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import { loadJwtKey } from './jwt-key.loader.js';

@Injectable()
export class JoseAccessTokenIssuer extends AccessTokenIssuer {
  private readonly privateKey: KeyObject;
  private readonly issuer: string;
  private readonly audience: string;
  private readonly expiresIn: string;

  constructor() {
    super();
    this.privateKey = loadJwtKey(
      'JWT_PRIVATE_KEY_PATH',
      'secrets/jwt-private.pem',
      (pem) => createPrivateKey(pem),
    );
    this.issuer = process.env['JWT_ISSUER'] ?? 'core-auth';
    this.audience = process.env['JWT_AUDIENCE'] ?? 'core-services';
    this.expiresIn = process.env['JWT_EXPIRES_IN'] ?? '1h';
  }

  async sign(principal: AuthenticatedPrincipal): Promise<string> {
    return await new SignJWT({
      email: principal.email,
      membershipId: principal.membershipId,
      organizationId: principal.organizationId,
      branchIds: principal.branchIds,
      roleCodes: principal.roleCodes,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setSubject(principal.sub)
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(this.expiresIn)
      .sign(this.privateKey);
  }
}
