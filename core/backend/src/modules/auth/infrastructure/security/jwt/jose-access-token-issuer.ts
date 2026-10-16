import { createPrivateKey, randomUUID, type KeyObject } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';
import { AccessTokenIssuer } from '../../../application/ports/access-token-issuer.js';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import type { TokenAudience } from '../../../application/contracts/token-audience.js';
import { loadJwtKey } from './jwt-key.loader.js';
import { accessTokenLifetimeSeconds } from '../../../application/contracts/access-token-lifetime.js';

@Injectable()
export class JoseAccessTokenIssuer extends AccessTokenIssuer {
  private readonly privateKey: KeyObject;
  private readonly issuer: string;
  private readonly expiresInSeconds: number;
  private readonly keyId: string;

  constructor() {
    super();
    this.privateKey = loadJwtKey(
      'JWT_PRIVATE_KEY_PATH',
      'secrets/jwt-private.pem',
      (pem) => createPrivateKey(pem),
    );
    this.issuer = process.env['JWT_ISSUER'] ?? 'core-auth';
    this.expiresInSeconds = accessTokenLifetimeSeconds();
    this.keyId = process.env['JWT_KEY_ID'] ?? 'core-auth-2026-01';
  }

  async sign( principal: AuthenticatedPrincipal, audience: TokenAudience ): Promise<string> {
    return await new SignJWT({
      membershipId: principal.membershipId,
      organizationId: principal.organizationId,
      branchIds: principal.branchIds,
      permissions: principal.permissions,
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'at+jwt', kid: this.keyId })
      .setSubject(principal.sub)
      .setJti(randomUUID())
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(audience)
      .setExpirationTime(`${this.expiresInSeconds}s`)
      .sign(this.privateKey);
  }
}
