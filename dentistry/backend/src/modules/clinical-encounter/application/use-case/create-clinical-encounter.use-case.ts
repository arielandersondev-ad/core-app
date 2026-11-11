import { Injectable } from '@nestjs/common';
import {
  ENCOUNTER_TEXT_FIELDS,
  type ClinicalEncounter,
  type EncounterTexts,
} from '../../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type EncounterScope,
} from '../../domain/repositories/clinical-encounter.repository.js';
import {
  ClinicalEncounterAccess,
  normalizeText,
} from '../clinical-encounter-access.js';
import { ClinicalErrors } from '../clinical-encounter.errors.js';

export type CreateClinicalEncounterCommand = EncounterScope &
  Partial<EncounterTexts> & {
    bodyPatientId: string;
    authorizedBranchIds: string[];
    branchId: string;
    appointmentId?: string;
    treatmentId?: string;
    startedAt: Date;
    actorMembershipId: string;
  };

const INELIGIBLE_APPOINTMENT_STATUSES = new Set(['CANCELED', 'NO_SHOW']);

@Injectable()
export class CreateClinicalEncounterUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  async execute(
    command: CreateClinicalEncounterCommand,
  ): Promise<ClinicalEncounter> {
    if (command.bodyPatientId !== command.patientId) {
      throw ClinicalErrors.patientMismatch();
    }
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);
    if (!command.authorizedBranchIds.includes(command.branchId)) {
      throw ClinicalErrors.branchForbidden();
    }

    if (command.appointmentId) {
      const appointment = await this.encounterRepository.findAppointment(
        scope,
        command.appointmentId,
      );
      if (!appointment) throw ClinicalErrors.appointmentNotFound();
      if (
        INELIGIBLE_APPOINTMENT_STATUSES.has(appointment.status) ||
        appointment.branchId !== command.branchId
      ) {
        throw ClinicalErrors.appointmentNotEligible();
      }
    }
    if (
      command.treatmentId &&
      !(await this.encounterRepository.treatmentExists(
        scope,
        command.treatmentId,
      ))
    ) {
      throw ClinicalErrors.treatmentNotFound();
    }

    const texts = Object.fromEntries(
      ENCOUNTER_TEXT_FIELDS.map((field) => [
        field,
        normalizeText(command[field]),
      ]),
    ) as EncounterTexts;

    return this.encounterRepository.create({
      ...scope,
      ...texts,
      branchId: command.branchId,
      // P6: el profesional responsable es siempre la membresía de la sesión.
      practitionerMembershipId: command.actorMembershipId,
      appointmentId: command.appointmentId ?? null,
      treatmentId: command.treatmentId ?? null,
      startedAt: command.startedAt,
      createdByMembershipId: command.actorMembershipId,
    });
  }
}
