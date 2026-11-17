import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { PlanEntitlementsReader } from './application/ports/plan-entitlements.reader.js';
import { DentistryTokenVerifier } from './infrastructure/jwt/dentistry-token.verifier.js';
import { PrismaPlanEntitlementsReader } from './infrastructure/prisma-plan-entitlements.reader.js';
import { DentistryAuthController } from './presentation/http/dentistry-auth.controller.js';
import { DentistryJwtGuard } from './presentation/http/guards/dentistry-jwt.guard.js';
import { DentistryModuleGuard } from './presentation/http/guards/dentistry-module.guard.js';
import { DentistryPermissionGuard } from './presentation/http/guards/dentistry-permission.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [DentistryAuthController],
  providers: [
    DentistryTokenVerifier,
    DentistryJwtGuard,
    DentistryPermissionGuard,
    DentistryModuleGuard,
    { provide: PlanEntitlementsReader, useClass: PrismaPlanEntitlementsReader },
  ],
  exports: [
    DentistryTokenVerifier,
    DentistryJwtGuard,
    DentistryPermissionGuard,
    DentistryModuleGuard,
    PlanEntitlementsReader,
  ],
})
export class DentistryAuthModule {}
