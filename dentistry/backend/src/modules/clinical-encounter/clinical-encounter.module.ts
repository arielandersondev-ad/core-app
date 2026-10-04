import { Module } from '@nestjs/common';
import { ClinicalEncounterRepository } from './domain/repositories/clinical-encounter.repository.js';
import { PrismaClinicalEncounterRepository } from './infrastructure/prisma-clinical-encounter.repository.js';
import { CreateClinicalEncounterUseCase } from './application/use-case/create-clinical-encounter.use-case.js';
import { ListClinicalEncountersUseCase } from './application/use-case/list-clinical-encounters.use-case.js';
import { GetClinicalEncounterByIdUseCase } from './application/use-case/get-clinical-encounter-by-id.use-case.js';
import { UpdateClinicalEncounterUseCase } from './application/use-case/update-clinical-encounter.use-case.js';
import { CompleteClinicalEncounterUseCase } from './application/use-case/complete-clinical-encounter.use-case.js';
import { ClinicalEncounterController } from './presentation/http/clinical-encounter.controller.js';

@Module({
  imports: [],
  controllers: [ClinicalEncounterController],
  providers: [
    {
      provide: ClinicalEncounterRepository,
      useClass: PrismaClinicalEncounterRepository,
    },
    CreateClinicalEncounterUseCase,
    ListClinicalEncountersUseCase,
    GetClinicalEncounterByIdUseCase,
    UpdateClinicalEncounterUseCase,
    CompleteClinicalEncounterUseCase,
  ],
  exports: [
    ClinicalEncounterRepository,
    CreateClinicalEncounterUseCase,
    ListClinicalEncountersUseCase,
    GetClinicalEncounterByIdUseCase,
  ],
})
export class ClinicalEncounterModule {}