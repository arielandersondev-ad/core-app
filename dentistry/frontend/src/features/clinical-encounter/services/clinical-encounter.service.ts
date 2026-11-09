import { CLINICAL_ENCOUNTER_DEMO_ENABLED } from "@/features/clinical-encounter/config/clinical-encounter-mode";
import { createClinicalEncounterHttpDataSource } from "@/features/clinical-encounter/services/clinical-encounter.http";
import { createClinicalEncounterMockDataSource } from "@/features/clinical-encounter/services/clinical-encounter.mock";
import type {
  AddClinicalFileInput,
  ClinicalEncounter,
  ClinicalEncounterListFilters,
  ClinicalEncounterProcedure,
  ClinicalEncounterProcedureDraft,
  ClinicalFile,
  CompleteClinicalEncounterInput,
  CreateClinicalEncounterInput,
  EncounterReferenceData,
  PatientHealthProfile,
  PatientHealthProfileInput,
  VoidClinicalEncounterInput,
} from "@/features/clinical-encounter/types/clinical-encounter";

export {
  ClinicalEncounterApiUnavailableError,
  ClinicalEncounterPartialCreateError,
  ClinicalEncounterStateError,
} from "@/features/clinical-encounter/services/clinical-encounter.error";

export interface ClinicalEncounterDataSource {
  list(patientId: string, filters?: ClinicalEncounterListFilters): Promise<ClinicalEncounter[]>;
  get(patientId: string, encounterId: string): Promise<ClinicalEncounter>;
  create(input: CreateClinicalEncounterInput): Promise<ClinicalEncounter>;
  complete(
    patientId: string,
    encounterId: string,
    input: CompleteClinicalEncounterInput,
  ): Promise<ClinicalEncounter>;
  void(patientId: string, encounterId: string, input: VoidClinicalEncounterInput): Promise<ClinicalEncounter>;
  addProcedures(
    patientId: string,
    encounterId: string,
    procedures: ClinicalEncounterProcedureDraft[],
  ): Promise<ClinicalEncounterProcedure[]>;
  getHealthProfile(patientId: string): Promise<PatientHealthProfile>;
  saveHealthProfile(patientId: string, input: PatientHealthProfileInput): Promise<PatientHealthProfile>;
  listFiles(patientId: string, encounterId?: string): Promise<ClinicalFile[]>;
  addFile(patientId: string, input: AddClinicalFileInput): Promise<ClinicalFile>;
  removeFile(patientId: string, fileId: string): Promise<void>;
  getReferenceData(patientId: string): Promise<EncounterReferenceData>;
}

let cachedDataSource: ClinicalEncounterDataSource | null = null;

export function getClinicalEncounterDataSource(): ClinicalEncounterDataSource {
  if (!cachedDataSource) {
    cachedDataSource = CLINICAL_ENCOUNTER_DEMO_ENABLED
      ? createClinicalEncounterMockDataSource()
      : createClinicalEncounterHttpDataSource();
  }

  return cachedDataSource;
}
