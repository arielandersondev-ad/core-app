import { Injectable } from '@nestjs/common';
import type { UserAuthRecord } from '../../../user/domain/entities/user.entity.js';
import { AccessTokenIssuer } from '../ports/access-token-issuer.js';
import type { AuthResult } from '../contracts/auth-result.js';
import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';
import type { TokenAudience } from '../contracts/token-audience.js';
import { accessTokenLifetimeSeconds } from '../contracts/access-token-lifetime.js';
import { permissionsForAudience } from './audience-permission-filter.js';
import { formatRefreshToken } from './refresh-token.js';

export type IssuedSession = { id: string; secret: string; expiresAt: Date };

@Injectable()
export class AuthSessionIssuer {
  constructor(private readonly tokenIssuer: AccessTokenIssuer) {}

  async issue(
    record: UserAuthRecord,
    audience: TokenAudience,
    session: IssuedSession,
    now: Date,
  ): Promise<AuthResult> {
    const principal: AuthenticatedPrincipal = {
      sub: record.user.id,
      sessionId: session.id,
      membershipId: record.membershipId,
      organizationId: record.organizationId,
      branchIds: record.branchIds,
      permissions: permissionsForAudience(record.permissions, audience),
    };

    return {
      access_token: await this.tokenIssuer.sign(principal, audience),
      token_type: 'Bearer',
      expires_in: accessTokenLifetimeSeconds(),
      refresh_token: formatRefreshToken(session.id, session.secret),
      refresh_expires_in: Math.max(
        1,
        Math.floor((session.expiresAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }
}
