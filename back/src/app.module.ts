import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { OrganizationModule } from './modules/organization/organization.module.js';

@Module({
  imports: [
    PrismaModule,
    OrganizationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
