import { Injectable } from '@nestjs/common';
import type { PaginatedResult } from '../../../../common/pagination/pagination.js';
import type { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type FindEncountersFilters,
} from '../../domain/repositories/clinical-encounter.repository.js';
import { ClinicalEncounterAccess } from '../clinical-encounter-access.js';

@Injectable()
export class ListClinicalEncountersUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    filters: FindEncountersFilters,
  ): Promise<PaginatedResult<ClinicalEncounter>> {
    await this.access.assertPatient(filters);
    return this.encounterRepository.findPage({
      ...filters,
      search: filters.search?.replace(/\s+/g, ' ').trim() || undefined,
    });
  }
}
