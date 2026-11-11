import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/infrastructure/prisma.module.js';
import { DentistryAuthModule } from '../auth/dentistry-auth.module.js';
import { PatientModule } from '../patient/patient.module.js';
import { ClinicalEncounterAccess } from './application/clinical-encounter-access.js';
import { AddClinicalEncounterProceduresUseCase } from './application/use-case/add-clinical-encounter-procedures.use-case.js';
import { CompleteClinicalEncounterUseCase } from './application/use-case/complete-clinical-encounter.use-case.js';
import { CreateClinicalEncounterUseCase } from './application/use-case/create-clinical-encounter.use-case.js';
import { GetClinicalEncounterUseCase } from './application/use-case/get-clinical-encounter.use-case.js';
import { GetEncounterReferenceDataUseCase } from './application/use-case/get-encounter-reference-data.use-case.js';
import { GetPatientHealthProfileUseCase } from './application/use-case/get-patient-health-profile.use-case.js';
import { ListClinicalEncountersUseCase } from './application/use-case/list-clinical-encounters.use-case.js';
import { SavePatientHealthProfileUseCase } from './application/use-case/save-patient-health-profile.use-case.js';
import { VoidClinicalEncounterUseCase } from './application/use-case/void-clinical-encounter.use-case.js';
import { ClinicalEncounterRepository } from './domain/repositories/clinical-encounter.repository.js';
import { PatientHealthProfileRepository } from './domain/repositories/patient-health-profile.repository.js';
import { PrismaClinicalEncounterRepository } from './infrastructure/prisma-clinical-encounter.repository.js';
import { PrismaPatientHealthProfileRepository } from './infrastructure/prisma-patient-health-profile.repository.js';
import { ClinicalEncounterController } from './presentation/http/clinical-encounter.controller.js';
import { PatientHealthProfileController } from './presentation/http/patient-health-profile.controller.js';

@Module({
  imports: [PrismaModule, DentistryAuthModule, PatientModule],
  controllers: [ClinicalEncounterController, PatientHealthProfileController],
  providers: [
    {
      provide: ClinicalEncounterRepository,
      useClass: PrismaClinicalEncounterRepository,
    },
    {
      provide: PatientHealthProfileRepository,
      useClass: PrismaPatientHealthProfileRepository,
    },
    ClinicalEncounterAccess,
    ListClinicalEncountersUseCase,
    GetClinicalEncounterUseCase,
    CreateClinicalEncounterUseCase,
    AddClinicalEncounterProceduresUseCase,
    CompleteClinicalEncounterUseCase,
    VoidClinicalEncounterUseCase,
    GetEncounterReferenceDataUseCase,
    GetPatientHealthProfileUseCase,
    SavePatientHealthProfileUseCase,
  ],
})
export class ClinicalEncounterModule {}
