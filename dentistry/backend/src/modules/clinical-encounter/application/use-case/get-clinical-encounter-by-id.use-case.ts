import { Injectable, NotFoundException } from '@nestjs/common';
import { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import { ClinicalEncounterRepository } from '../../domain/repositories/clinical-encounter.repository.js';

@Injectable()
export class GetClinicalEncounterByIdUseCase {
  constructor(private readonly clinicalEncounterRepository: ClinicalEncounterRepository) {}

  async execute(id: string): Promise<ClinicalEncounter> {
    const encounter = await this.clinicalEncounterRepository.findById(id);
    if (!encounter) {
      throw new NotFoundException(`Consulta con ID "${id}" no encontrada.`);
    }
    return encounter;
  }
}