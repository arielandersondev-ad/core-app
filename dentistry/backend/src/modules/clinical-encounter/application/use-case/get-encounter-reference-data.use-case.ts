import { Injectable } from '@nestjs/common';
import {
  ClinicalEncounterRepository,
  type EncounterReferenceData,
  type EncounterScope,
} from '../../domain/repositories/clinical-encounter.repository.js';
import { ClinicalEncounterAccess } from '../clinical-encounter-access.js';

@Injectable()
export class GetEncounterReferenceDataUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    scope: EncounterScope & {
      authorizedBranchIds: string[];
      membershipId: string;
    },
  ): Promise<EncounterReferenceData> {
    await this.access.assertPatient(scope);
    return this.encounterRepository.getReferenceData(scope);
  }
}
