import type {
  HealthProfileTexts,
  PatientHealthProfile,
} from '../entities/patient-health-profile.entity.js';
import type { EncounterScope } from './clinical-encounter.repository.js';

export abstract class PatientHealthProfileRepository {
  abstract find(scope: EncounterScope): Promise<PatientHealthProfile | null>;

  /** Lanza 409 si otro usuario lo creó entretanto (unique de `patientId`). */
  abstract create(
    scope: EncounterScope,
    texts: HealthProfileTexts,
    actorMembershipId: string,
  ): Promise<PatientHealthProfile>;

  /** Devuelve null si `rowVersion` ya no coincide. */
  abstract update(
    scope: EncounterScope,
    expectedRowVersion: number,
    texts: HealthProfileTexts,
    actorMembershipId: string,
  ): Promise<PatientHealthProfile | null>;
}
