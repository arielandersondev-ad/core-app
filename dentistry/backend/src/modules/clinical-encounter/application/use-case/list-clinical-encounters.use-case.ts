import { Injectable } from '@nestjs/common';
import { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  FindClinicalEncountersFilters,
} from '../../domain/repositories/clinical-encounter.repository.js';

@Injectable()
export class ListClinicalEncountersUseCase {
  constructor(private readonly clinicalEncounterRepository: ClinicalEncounterRepository) {}

  async execute(filters: FindClinicalEncountersFilters): Promise<ClinicalEncounter[]> {
    return this.clinicalEncounterRepository.findByFilters(filters);
  }
}