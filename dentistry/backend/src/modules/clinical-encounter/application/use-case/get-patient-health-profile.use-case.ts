import { Injectable } from '@nestjs/common';
import {
  HEALTH_PROFILE_FIELDS,
  type HealthProfileTexts,
  type PatientHealthProfile,
} from '../../domain/entities/patient-health-profile.entity.js';
import type { EncounterScope } from '../../domain/repositories/clinical-encounter.repository.js';
import { PatientHealthProfileRepository } from '../../domain/repositories/patient-health-profile.repository.js';
import { ClinicalEncounterAccess } from '../clinical-encounter-access.js';

@Injectable()
export class GetPatientHealthProfileUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly profileRepository: PatientHealthProfileRepository,
  ) {}

  /** Un perfil inexistente se devuelve vacío (“Sin registrar”), no como 404. */
  async execute(scope: EncounterScope): Promise<PatientHealthProfile> {
    await this.access.assertPatient(scope);
    return (
      (await this.profileRepository.find(scope)) ?? emptyProfile(scope.patientId)
    );
  }
}

export function emptyProfile(patientId: string): PatientHealthProfile {
  const texts = Object.fromEntries(
    HEALTH_PROFILE_FIELDS.map((field) => [field, null]),
  ) as HealthProfileTexts;
  return { patientId, ...texts, updatedAt: null, rowVersion: 0 };
}
