import { Module } from '@nestjs/common';
import { PrismaModule } from './common/infrastructure/prisma.module.js';
import { AppointmentModule } from './modules/appointment/appointment.module.js';
import { DentalServiceModule } from './modules/service/dental-service.module.js';
import { PatientModule } from './modules/patient/patient.module.js';

@Module({
  imports: [
    PrismaModule,
    AppointmentModule,
    DentalServiceModule,
    PatientModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
