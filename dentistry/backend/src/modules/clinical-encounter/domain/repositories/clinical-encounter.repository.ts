import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../common/pagination/pagination.js';
import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
  ClinicalEncounterStatus,
  EncounterTexts,
  ProcedureTargetType,
} from '../entities/clinical-encounter.entity.js';

export type EncounterScope = {
  organizationId: string;
  patientId: string;
};

export type FindEncountersFilters = EncounterScope & {
  authorizedBranchIds: string[];
  status?: ClinicalEncounterStatus;
  practitionerMembershipId?: string;
  search?: string;
} & PaginationInput;

export type ClinicalEncounterCreateData = EncounterScope &
  EncounterTexts & {
    branchId: string;
    practitionerMembershipId: string;
    appointmentId: string | null;
    treatmentId: string | null;
    startedAt: Date;
    createdByMembershipId: string;
  };

export type ProcedureCreateData = {
  targetType: ProcedureTargetType;
  toothNumber: string | null;
  targetDescription: string | null;
  description: string;
  treatmentProcedureId: string | null;
};

/** Cambio de estado/cierre aplicado solo si `rowVersion` no cambió. */
export type EncounterTransition = {
  status: ClinicalEncounterStatus;
  endedAt?: Date;
  procedureSummary?: string | null;
  completedAt?: Date;
  completedByMembershipId?: string;
  voidedAt?: Date;
  voidedByMembershipId?: string;
  voidReason?: string;
  updatedByMembershipId: string;
};

export type AppointmentReference = {
  id: string;
  branchId: string;
  status: string;
};

export type TreatmentProcedureReference = {
  id: string;
  treatmentId: string;
  status: string;
};

export type ReferenceOption = { id: string; label: string };

export type EncounterReferenceData = {
  branches: ReferenceOption[];
  practitioners: ReferenceOption[];
  /** `treatmentId` permite al alta sugerir el tratamiento de la cita. */
  appointments: (ReferenceOption & { treatmentId?: string })[];
  treatments: ReferenceOption[];
  treatmentProcedures: (ReferenceOption & { treatmentId: string })[];
};

export abstract class ClinicalEncounterRepository {
  abstract findPage(
    filters: FindEncountersFilters,
  ): Promise<PaginatedResult<ClinicalEncounter>>;

  abstract findById(
    scope: EncounterScope,
    id: string,
  ): Promise<ClinicalEncounter | null>;

  /** Lanza 409 si la cita ya tiene una atención (unique de `appointmentId`). */
  abstract create(data: ClinicalEncounterCreateData): Promise<ClinicalEncounter>;

  /** Devuelve null si la atención cambió de versión o de estado entretanto. */
  abstract transition(
    scope: EncounterScope,
    id: string,
    expectedRowVersion: number,
    change: EncounterTransition,
  ): Promise<ClinicalEncounter | null>;

  /**
   * Inserta el lote de forma atómica, solo si la atención sigue en curso y en
   * la versión esperada. Devuelve null en caso contrario.
   */
  abstract addProcedures(
    scope: EncounterScope,
    encounterId: string,
    expectedRowVersion: number,
    procedures: ProcedureCreateData[],
    actorMembershipId: string,
  ): Promise<ClinicalEncounterProcedure[] | null>;

  abstract findAppointment(
    scope: EncounterScope,
    appointmentId: string,
  ): Promise<AppointmentReference | null>;

  abstract treatmentExists(
    scope: EncounterScope,
    treatmentId: string,
  ): Promise<boolean>;

  abstract findTreatmentProcedures(
    scope: EncounterScope,
    ids: string[],
  ): Promise<TreatmentProcedureReference[]>;

  abstract getReferenceData(
    scope: EncounterScope & {
      authorizedBranchIds: string[];
      membershipId: string;
    },
  ): Promise<EncounterReferenceData>;
}
