import { Injectable } from '@nestjs/common';
import type { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import type { EncounterScope } from '../../domain/repositories/clinical-encounter.repository.js';
import { ClinicalEncounterAccess } from '../clinical-encounter-access.js';

@Injectable()
export class GetClinicalEncounterUseCase {
  constructor(private readonly access: ClinicalEncounterAccess) {}

  execute(
    scope: EncounterScope,
    encounterId: string,
    authorizedBranchIds: string[],
  ): Promise<ClinicalEncounter> {
    return this.access.loadEncounter(scope, encounterId, authorizedBranchIds);
  }
}
