import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';
import { DentistryAuthModule } from './modules/auth/dentistry-auth.module.js';

@Module({
  imports: [PrismaModule, DentistryAuthModule, AppointmentModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
