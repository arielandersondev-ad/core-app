import { Module } from '@nestjs/common';
import { DentistryTokenVerifier } from './infrastructure/jwt/dentistry-token.verifier.js';
import { DentistryAuthController } from './presentation/http/dentistry-auth.controller.js';
import { DentistryJwtGuard } from './presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryPermissionGuard } from './presentation/http/guards/dentistry-permission.guard.js';

@Module({
  controllers: [DentistryAuthController],
  providers: [DentistryTokenVerifier, DentistryJwtGuard, DentistryPermissionGuard],
  exports: [
    DentistryTokenVerifier,
    DentistryJwtGuard,
    DentistryPermissionGuard,
  ],
})
export class DentistryAuthModule {}
