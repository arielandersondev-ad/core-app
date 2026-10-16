import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { CreatePatientUseCase } from './application/use-case/create-patient.use-case.js';
import { GetPatientByIdUseCase } from './application/use-case/get-patient-by-id.use-case.js';
import { ListPatientsUseCase } from './application/use-case/list-patients.use-case.js';
import { UpdatePatientUseCase } from './application/use-case/update-patient.use-case.js';
import { PatientRepository } from './domain/repositories/patient.repository.js';
import { PrismaPatientRepository } from './infrastructure/prisma-patient.repository.js';
import { PatientController } from './presentation/http/patient.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [PatientController],
  providers: [
    {
      provide: PatientRepository,
      useClass: PrismaPatientRepository,
    },
    ListPatientsUseCase,
    GetPatientByIdUseCase,
    CreatePatientUseCase,
    UpdatePatientUseCase,
  ],
  exports: [
    PatientRepository,
    ListPatientsUseCase,
    GetPatientByIdUseCase,
    CreatePatientUseCase,
  ],
})
export class PatientModule {}
