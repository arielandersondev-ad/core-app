import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import { ClinicalEncounterRepository } from '../../domain/repositories/clinical-encounter.repository.js';

export interface CompleteClinicalEncounterCommand {
  id: string;
  endedAt?: string;
  updatedByMembershipId: string;
}

@Injectable()
export class CompleteClinicalEncounterUseCase {
  constructor(private readonly clinicalEncounterRepository: ClinicalEncounterRepository) {}

  async execute(command: CompleteClinicalEncounterCommand): Promise<ClinicalEncounter> {
    const encounter = await this.clinicalEncounterRepository.findById(command.id);
    if (!encounter) {
      throw new NotFoundException(`Consulta con ID "${command.id}" no encontrada.`);
    }

    const endedAt = command.endedAt ? new Date(command.endedAt) : undefined;

    try {
      encounter.complete(command.updatedByMembershipId, endedAt);
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    return this.clinicalEncounterRepository.update(encounter);
  }
}