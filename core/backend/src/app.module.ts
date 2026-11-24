import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { UserModule } from './modules/user/user.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PlanModule } from './modules/plan/plan.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { DevAuthModule } from './modules/dev-auth/dev-auth.module.js';
import { devTokenExchangeEnabled } from './modules/dev-auth/dev-token-exchange.config.js';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    OrganizationModule,
    UserModule,
    RoleModule,
    AuthModule,
    PlanModule,
    // Solo en desarrollo y con DEV_TOKEN_EXCHANGE_SECRET: en otro entorno las rutas no existen.
    ...(devTokenExchangeEnabled() ? [DevAuthModule] : []),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
