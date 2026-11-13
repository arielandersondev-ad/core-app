import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';
import { DentalServiceModule } from './modules/service/dental-service.module.js';
import { PatientModule } from './modules/patient/patient.module.js';
import { PersonModule } from './modules/person/person.module.js';
import { DentistryAuthModule } from './modules/auth/dentistry-auth.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ClinicalEncounterModule } from './modules/clinical-encounter/clinical-encounter.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';

@Module({
  imports: [
    HealthModule,
    PrismaModule,
    DentistryAuthModule,
    AppointmentModule,
    DentalServiceModule,
    PatientModule,
    PersonModule,
    ClinicalEncounterModule,
    InventoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
