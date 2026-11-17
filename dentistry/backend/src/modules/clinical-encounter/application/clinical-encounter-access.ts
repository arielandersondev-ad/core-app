import { Injectable } from '@nestjs/common';
import { PatientRepository } from '../../patient/domain/repositories/patient.repository.js';
import type { ClinicalEncounter } from '../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  type EncounterScope,
} from '../domain/repositories/clinical-encounter.repository.js';
import { ClinicalErrors } from './clinical-encounter.errors.js';

/** Comprobaciones de alcance comunes a los casos de uso clínicos. */
@Injectable()
export class ClinicalEncounterAccess {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly encounterRepository: ClinicalEncounterRepository,
  ) {}

  /** 404 si el paciente no existe, está eliminado o es de otra organización. */
  async assertPatient(scope: EncounterScope): Promise<void> {
    const patient = await this.patientRepository.findById(
      scope.patientId,
      scope.organizationId,
    );
    if (!patient || patient.deletedAt !== null) {
      throw ClinicalErrors.patientNotFound();
    }
  }

  /** La cita debe ser del paciente, de la misma sucursal y no cancelada ni ausente. */
  async assertEligibleAppointment(
    scope: EncounterScope,
    appointmentId: string,
    branchId: string,
  ): Promise<void> {
    const appointment = await this.encounterRepository.findAppointment(
      scope,
      appointmentId,
    );
    if (!appointment) throw ClinicalErrors.appointmentNotFound();
    if (
      INELIGIBLE_APPOINTMENT_STATUSES.has(appointment.status) ||
      appointment.branchId !== branchId
    ) {
      throw ClinicalErrors.appointmentNotEligible();
    }
  }

  /** Paciente accesible + atención del paciente en una sucursal autorizada. */
  async loadEncounter(
    scope: EncounterScope,
    encounterId: string,
    authorizedBranchIds: string[],
  ): Promise<ClinicalEncounter> {
    await this.assertPatient(scope);
    const encounter = await this.encounterRepository.findById(
      scope,
      encounterId,
    );
    if (!encounter) throw ClinicalErrors.encounterNotFound();
    if (!authorizedBranchIds.includes(encounter.branchId)) {
      throw ClinicalErrors.branchForbidden();
    }
    return encounter;
  }
}

const INELIGIBLE_APPOINTMENT_STATUSES = new Set(['CANCELED', 'NO_SHOW']);

/** Recorta y convierte la cadena vacía en null: vacío no es una respuesta clínica. */
export function normalizeText(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
