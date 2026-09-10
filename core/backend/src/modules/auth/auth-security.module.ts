import { Module } from '@nestjs/common';
import { AccessTokenIssuer } from './application/ports/access-token-issuer.js';
import { AccessTokenVerifier } from './application/ports/access-token-verifier.js';
import { JoseAccessTokenIssuer } from './infrastructure/security/jwt/jose-access-token-issuer.js';
import { JoseAccessTokenVerifier } from './infrastructure/security/jwt/jose-access-token-verifier.js';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard.js';
import { RolesGuard } from './presentation/http/guards/roles.guard.js';

@Module({
  providers: [
    { provide: AccessTokenIssuer, useClass: JoseAccessTokenIssuer },
    { provide: AccessTokenVerifier, useClass: JoseAccessTokenVerifier },
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AccessTokenIssuer, AccessTokenVerifier, JwtAuthGuard, RolesGuard],
})
export class AuthSecurityModule {}
