import { Injectable } from '@nestjs/common';
import type { ClinicalEncounter } from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type EncounterScope,
} from '../../domain/repositories/clinical-encounter.repository.js';
import {
  ClinicalEncounterAccess,
  normalizeText,
} from '../clinical-encounter-access.js';
import { ClinicalErrors } from '../clinical-encounter.errors.js';

export type CompleteClinicalEncounterCommand = EncounterScope & {
  encounterId: string;
  authorizedBranchIds: string[];
  endedAt: Date;
  procedureSummary?: string | null;
  actorMembershipId: string;
};

@Injectable()
export class CompleteClinicalEncounterUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: CompleteClinicalEncounterCommand,
  ): Promise<ClinicalEncounter> {
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const encounter = await this.access.loadEncounter(
      scope,
      command.encounterId,
      command.authorizedBranchIds,
    );
    if (encounter.status !== 'IN_PROGRESS') {
      throw ClinicalErrors.notInProgress('completar');
    }
    if (command.endedAt.getTime() < encounter.startedAt.getTime()) {
      throw ClinicalErrors.invalidEndedAt();
    }

    // P2: completar no exige procedureSummary ni procedimientos registrados.
    const updated = await this.encounterRepository.transition(
      scope,
      encounter.id,
      encounter.rowVersion,
      {
        status: 'COMPLETED',
        endedAt: command.endedAt,
        completedAt: new Date(),
        completedByMembershipId: command.actorMembershipId,
        updatedByMembershipId: command.actorMembershipId,
        ...(command.procedureSummary !== undefined
          ? { procedureSummary: normalizeText(command.procedureSummary) }
          : {}),
      },
    );
    if (!updated) throw ClinicalErrors.encounterChanged();
    return updated;
  }
}
