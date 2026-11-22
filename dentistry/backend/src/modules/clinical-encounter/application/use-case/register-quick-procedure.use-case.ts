import { Injectable } from '@nestjs/common';
import { appointmentSyncFor } from '../../domain/appointment-sync.js';
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
import {
  toCreateData,
  type ProcedureDraft,
} from './add-clinical-encounter-procedures.use-case.js';

export type RegisterQuickProcedureCommand = EncounterScope & {
  authorizedBranchIds: string[];
  branchId: string;
  appointmentId?: string;
  /** Momento en que se realizó; por defecto, ahora. */
  performedAt?: Date;
  procedureSummary?: string | null;
  procedures: Omit<ProcedureDraft, 'treatmentProcedureId'>[];
  actorMembershipId: string;
};

/**
 * "Atención rápida": registra procedimientos sueltos del paciente en un paso,
 * como una atención ya completada. La cita, si se indica, queda vinculada y
 * pasa a completada (salvo que ya lo estuviera).
 */
@Injectable()
export class RegisterQuickProcedureUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: RegisterQuickProcedureCommand,
  ): Promise<ClinicalEncounter> {
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    const procedures = command.procedures.map(toCreateData);
    await this.access.assertPatient(scope);
    if (!command.authorizedBranchIds.includes(command.branchId)) {
      throw ClinicalErrors.branchForbidden();
    }
    if (command.appointmentId) {
      await this.access.assertEligibleAppointment(
        scope,
        command.appointmentId,
        command.branchId,
      );
    }

    return this.encounterRepository.createCompletedWithProcedures(
      {
        ...scope,
        branchId: command.branchId,
        practitionerMembershipId: command.actorMembershipId,
        appointmentId: command.appointmentId ?? null,
        treatmentId: null,
        startedAt: command.performedAt ?? new Date(),
        chiefComplaint: null,
        examinationSummary: null,
        diagnosisSummary: null,
        procedureSummary: normalizeText(command.procedureSummary),
        progressNotes: null,
        patientInstructions: null,
        notes: null,
        createdByMembershipId: command.actorMembershipId,
      },
      procedures,
      appointmentSyncFor('COMPLETED', command.appointmentId),
    );
  }
}
