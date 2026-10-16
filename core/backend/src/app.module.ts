import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';
import { UserModule } from './modules/user/user.module.js';
import { RoleModule } from './modules/role/role.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { PlanModule } from './modules/plan/plan.module.js';
import { HealthModule } from './modules/health/health.module.js';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    OrganizationModule,
    UserModule,
    RoleModule,
    AuthModule,
    PlanModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
