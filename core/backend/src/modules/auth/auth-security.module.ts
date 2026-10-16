import { Module } from '@nestjs/common';
import { AccessTokenIssuer } from './application/ports/access-token-issuer.js';
import { AccessTokenVerifier } from './application/ports/access-token-verifier.js';
import { JoseAccessTokenIssuer } from './infrastructure/security/jwt/jose-access-token-issuer.js';
import { JoseAccessTokenVerifier } from './infrastructure/security/jwt/jose-access-token-verifier.js';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard.js';
import { RolesGuard } from './presentation/http/guards/roles.guard.js';
import { CoreAccessGuard } from './presentation/http/guards/core-access.guard.js';
import { CorePermissionService } from './infrastructure/security/core-permission.service.js';

@Module({
  providers: [
    { provide: AccessTokenIssuer, useClass: JoseAccessTokenIssuer },
    { provide: AccessTokenVerifier, useClass: JoseAccessTokenVerifier },
    JwtAuthGuard,
    RolesGuard,
    CoreAccessGuard,
    CorePermissionService
  ],
  exports: [AccessTokenIssuer, AccessTokenVerifier, JwtAuthGuard, RolesGuard, CoreAccessGuard, CorePermissionService],
})
export class AuthSecurityModule {}
