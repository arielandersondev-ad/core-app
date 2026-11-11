import { Injectable } from '@nestjs/common';
import {
  HEALTH_PROFILE_FIELDS,
  type HealthProfileTexts,
  type PatientHealthProfile,
} from '../../domain/entities/patient-health-profile.entity.js';
import type { EncounterScope } from '../../domain/repositories/clinical-encounter.repository.js';
import { PatientHealthProfileRepository } from '../../domain/repositories/patient-health-profile.repository.js';
import {
  ClinicalEncounterAccess,
  normalizeText,
} from '../clinical-encounter-access.js';
import { ClinicalErrors } from '../clinical-encounter.errors.js';

export type SavePatientHealthProfileCommand = EncounterScope &
  Partial<HealthProfileTexts> & {
    /** Versión que el cliente leyó; 0 si el perfil aún no existía. */
    rowVersion?: number;
    actorMembershipId: string;
  };

@Injectable()
export class SavePatientHealthProfileUseCase {
  constructor(
    private readonly access: ClinicalEncounterAccess,
    private readonly profileRepository: PatientHealthProfileRepository,
  ) {}

  /** PATCH: los campos omitidos conservan su valor; `null` o "" lo borran. */
  async execute(
    command: SavePatientHealthProfileCommand,
  ): Promise<PatientHealthProfile> {
    const scope: EncounterScope = {
      organizationId: command.organizationId,
      patientId: command.patientId,
    };
    await this.access.assertPatient(scope);
    const current = await this.profileRepository.find(scope);
    const currentVersion = current?.rowVersion ?? 0;
    if (
      command.rowVersion !== undefined &&
      command.rowVersion !== currentVersion
    ) {
      throw ClinicalErrors.healthProfileStale();
    }

    const texts = Object.fromEntries(
      HEALTH_PROFILE_FIELDS.map((field) => [
        field,
        command[field] === undefined
          ? (current?.[field] ?? null)
          : normalizeText(command[field]),
      ]),
    ) as HealthProfileTexts;

    if (!current) {
      return this.profileRepository.create(
        scope,
        texts,
        command.actorMembershipId,
      );
    }
    const updated = await this.profileRepository.update(
      scope,
      currentVersion,
      texts,
      command.actorMembershipId,
    );
    if (!updated) throw ClinicalErrors.healthProfileStale();
    return updated;
  }
}
