import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { TreatmentAccess } from './application/treatment-access.js';
import { CreateTreatmentUseCase } from './application/use-case/create-treatment.use-case.js';
import { GetTreatmentUseCase } from './application/use-case/get-treatment.use-case.js';
import { ListTreatmentsUseCase } from './application/use-case/list-treatments.use-case.js';
import { UpdateTreatmentUseCase } from './application/use-case/update-treatment.use-case.js';
import { TreatmentRepository } from './domain/repositories/treatment.repository.js';
import { PrismaTreatmentRepository } from './infrastructure/prisma-treatment.repository.js';
import { TreatmentController } from './presentation/http/treatment.controller.js';

@Module({
  imports: [PrismaModule, DentistryAuthModule, PatientModule],
  controllers: [TreatmentController],
  providers: [
    { provide: TreatmentRepository, useClass: PrismaTreatmentRepository },
    TreatmentAccess,
    ListTreatmentsUseCase,
    GetTreatmentUseCase,
    CreateTreatmentUseCase,
    UpdateTreatmentUseCase,
  ],
  exports: [TreatmentRepository],
})
export class TreatmentModule {}
