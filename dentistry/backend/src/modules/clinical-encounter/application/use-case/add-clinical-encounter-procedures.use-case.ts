import { Injectable } from '@nestjs/common';
import {
  FDI_TOOTH_PATTERN,
  type ClinicalEncounterProcedure,
  type ProcedureTargetType,
} from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type EncounterScope,
  type ProcedureCreateData,
} from '../../domain/repositories/clinical-encounter.repository.js';
import {
  ClinicalEncounterAccess,
  normalizeText,
} from '../clinical-encounter-access.js';
import { ClinicalErrors } from '../clinical-encounter.errors.js';

export type ProcedureDraft = {
  targetType: ProcedureTargetType;
  toothNumber?: string | null;
  targetDescription?: string | null;
  description: string;
  treatmentProcedureId?: string | null;
};

export type AddClinicalEncounterProceduresCommand = EncounterScope & {
  encounterId: string;
  authorizedBranchIds: string[];
  procedures: ProcedureDraft[];
  actorMembershipId: string;
};

@Injectable()
export class AddClinicalEncounterProceduresUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: AddClinicalEncounterProceduresCommand,
  ): Promise<ClinicalEncounterProcedure[]> {
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const procedures = command.procedures.map(toCreateData);
    const encounter = await this.access.loadEncounter(
      scope,
      command.encounterId,
      command.authorizedBranchIds,
    );
    if (encounter.status !== 'IN_PROGRESS') {
      throw ClinicalErrors.notInProgress('registrar procedimientos');
    }

    const plannedIds = [
      ...new Set(
        procedures
          .map((procedure) => procedure.treatmentProcedureId)
          .filter((id): id is string => id !== null),
      ),
    ];
    if (plannedIds.length > 0) {
      const planned = await this.encounterRepository.findTreatmentProcedures(
        scope,
        plannedIds,
      );
      if (planned.length !== plannedIds.length) {
        throw ClinicalErrors.treatmentProcedureNotFound();
      }
      const mismatch = planned.some(
        (item) =>
          item.status === 'CANCELED' ||
          (encounter.treatmentId !== null &&
            item.treatmentId !== encounter.treatmentId),
      );
      if (mismatch) throw ClinicalErrors.treatmentProcedureMismatch();
    }

    const created = await this.encounterRepository.addProcedures(
      scope,
      encounter.id,
      encounter.rowVersion,
      procedures,
      command.actorMembershipId,
    );
    if (!created) throw ClinicalErrors.encounterChanged();
    return created;
  }
}

/** Regla de objetivo: pieza FDI solo y siempre para `TOOTH`. */
function toCreateData(draft: ProcedureDraft): ProcedureCreateData {
  const toothNumber = normalizeText(draft.toothNumber);
  const description = normalizeText(draft.description);
  if (!description) {
    throw ClinicalErrors.invalidProcedureTarget(
      'La descripción del procedimiento es obligatoria.',
    );
  }
  if (draft.targetType === 'TOOTH') {
    if (!toothNumber || !FDI_TOOTH_PATTERN.test(toothNumber)) {
      throw ClinicalErrors.invalidProcedureTarget(
        'La pieza dental debe ser un número FDI válido.',
      );
    }
  } else if (toothNumber) {
    throw ClinicalErrors.invalidProcedureTarget(
      'Solo los procedimientos sobre una pieza (TOOTH) admiten número de pieza.',
    );
  }
  return {
    targetType: draft.targetType,
    toothNumber,
    targetDescription: normalizeText(draft.targetDescription),
    description,
    treatmentProcedureId: draft.treatmentProcedureId ?? null,
  };
}
