import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import { ClinicalEncounterRepository } from '../../domain/repositories/clinical-encounter.repository.js';

export interface UpdateClinicalEncounterCommand {
  id: string;
  chiefComplaint?: string;
  diagnosis?: string;
  procedurePerformed?: string;
  evolution?: string;
  recommendations?: string;
  notes?: string;
  updatedByMembershipId: string;
}

@Injectable()
export class UpdateClinicalEncounterUseCase {
  constructor(private readonly clinicalEncounterRepository: ClinicalEncounterRepository) {}

  async execute(command: UpdateClinicalEncounterCommand): Promise<ClinicalEncounter> {
    const encounter = await this.clinicalEncounterRepository.findById(command.id);
    if (!encounter) {
      throw new NotFoundException(`Consulta con ID "${command.id}" no encontrada.`);
    }

    if (!encounter.isOpen) {
      throw new BadRequestException(
        'No se puede modificar una consulta que ya fue completada.',
      );
    }

    // Cada campo se aplica sólo si viene presente, de modo que un PATCH parcial
    // no borra lo ya registrado.
    if (command.chiefComplaint !== undefined) {
      encounter.recordChiefComplaint(command.chiefComplaint);
    }
    if (command.diagnosis !== undefined) {
      encounter.recordDiagnosis(command.diagnosis);
    }
    if (command.procedurePerformed !== undefined) {
      encounter.recordProcedure(command.procedurePerformed);
    }
    if (command.evolution !== undefined) {
      encounter.recordEvolution(command.evolution);
    }
    if (command.recommendations !== undefined) {
      encounter.recordRecommendations(command.recommendations);
    }
    if (command.notes !== undefined) {
      encounter.updateNotes(command.notes);
    }

    return this.clinicalEncounterRepository.update(encounter);
  }
}