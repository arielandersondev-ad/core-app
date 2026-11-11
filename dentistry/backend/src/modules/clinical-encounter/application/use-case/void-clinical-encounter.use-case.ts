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

export type VoidClinicalEncounterCommand = EncounterScope & {
  encounterId: string;
  authorizedBranchIds: string[];
  reason: string;
  actorMembershipId: string;
};

@Injectable()
export class VoidClinicalEncounterUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: VoidClinicalEncounterCommand,
  ): Promise<ClinicalEncounter> {
    const reason = normalizeText(command.reason);
    if (!reason) throw ClinicalErrors.voidReasonRequired();
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const encounter = await this.access.loadEncounter(
      scope,
      command.encounterId,
      command.authorizedBranchIds,
    );
    if (encounter.status === 'VOIDED') throw ClinicalErrors.alreadyVoided();

    // Se anula desde IN_PROGRESS o COMPLETED; los procedimientos se conservan.
    const updated = await this.encounterRepository.transition(
      scope,
      encounter.id,
      encounter.rowVersion,
      {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedByMembershipId: command.actorMembershipId,
        voidReason: reason,
        updatedByMembershipId: command.actorMembershipId,
      },
    );
    if (!updated) throw ClinicalErrors.encounterChanged();
    return updated;
  }
}
