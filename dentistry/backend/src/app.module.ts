import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';
import { ClinicalEncounterModule } from './modules/clinical-encounter/clinical-encounter.module.js';

@Module({
  imports: [PrismaModule, AppointmentModule, ClinicalEncounterModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
