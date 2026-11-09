export type ClinicalEncounterStatus = "IN_PROGRESS" | "COMPLETED" | "VOIDED";
export type ClinicalEncounterTargetType = "TOOTH" | "REGION" | "WHOLE_MOUTH" | "OTHER";
export type ClinicalEncounterProcedureStatus = "RECORDED" | "VOIDED";
export type ClinicalFileCategory = "RADIOGRAPH" | "PHOTO" | "DOCUMENT" | "OTHER";
export type ClinicalFileUploadStatus = "PENDING" | "READY" | "FAILED";
export type ClinicalFileLaterality = "LEFT" | "RIGHT" | "BILATERAL";

export interface ClinicalEncounterProcedure {
  id: string;
  clinicalEncounterId: string;
  targetType: ClinicalEncounterTargetType;
  toothNumber?: string;
  targetDescription?: string;
  description: string;
  treatmentProcedureId?: string;
  status: ClinicalEncounterProcedureStatus;
  voidedAt?: string;
  voidedByMembershipId?: string;
  voidReason?: string;
}

export interface ClinicalEncounterProcedureDraft {
  targetType: ClinicalEncounterTargetType;
  toothNumber?: string;
  targetDescription?: string;
  description: string;
  treatmentProcedureId?: string;
}
export type ProcedureDraft = ClinicalEncounterProcedureDraft;

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  branchId: string;
  branchName?: string; // presentación; la fuente autorizada aún no está aprobada
  practitionerMembershipId: string;
  practitionerName?: string; // presentación
  startedAt: string;
  endedAt?: string;
  chiefComplaint?: string | null;
  examinationSummary?: string | null;
  diagnosisSummary?: string | null;
  procedureSummary?: string | null;
  progressNotes?: string | null;
  patientInstructions?: string | null;
  notes?: string | null;
  status: ClinicalEncounterStatus;
  appointmentId?: string;
  treatmentId?: string;
  procedures: ClinicalEncounterProcedure[];
  completedAt?: string;
  completedByMembershipId?: string;
  completedByName?: string; // presentación
  voidedAt?: string;
  voidedByMembershipId?: string;
  voidReason?: string;
  rowVersion?: number;
}

export interface PatientHealthProfile {
  patientId: string;
  medicalHistory: string | null;
  allergies: string | null;
  currentMedications: string | null;
  dentalHistory: string | null;
  relevantConditions: string | null;
  observations: string | null;
  updatedAt?: string;
  rowVersion?: number;
}

export interface ClinicalFile {
  id: string;
  patientId: string;
  clinicalEncounterId?: string;
  treatmentId?: string;
  appointmentId?: string;
  originalFilename: string;
  category: ClinicalFileCategory;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  uploadStatus: ClinicalFileUploadStatus;
  radiographType?: string;
  toothNumber?: string;
  region?: string;
  laterality?: ClinicalFileLaterality;
  capturedAt?: string;
  notes?: string;
}

export interface EncounterReferenceOption {
  id: string;
  label: string;
}

export interface TreatmentProcedureOption extends EncounterReferenceOption {
  treatmentId: string;
}

export interface EncounterReferenceData {
  branches: EncounterReferenceOption[];
  practitioners: EncounterReferenceOption[];
  appointments: EncounterReferenceOption[];
  treatments: EncounterReferenceOption[];
  treatmentProcedures: TreatmentProcedureOption[];
}

export interface CreateClinicalEncounterInput {
  patientId: string;
  branchId: string;
  appointmentId?: string;
  treatmentId?: string;
  startedAt: string;
  chiefComplaint?: string | null;
  examinationSummary?: string | null;
  diagnosisSummary?: string | null;
  procedureSummary?: string | null;
  progressNotes?: string | null;
  patientInstructions?: string | null;
  notes?: string | null;
}

export interface CreateClinicalEncounterWithProceduresInput {
  encounter: CreateClinicalEncounterInput;
  procedures: ClinicalEncounterProcedureDraft[];
}

export interface CompleteClinicalEncounterInput {
  endedAt: string;
  procedureSummary?: string | null;
}

export interface VoidClinicalEncounterInput {
  reason: string;
}

export type PatientHealthProfileInput = Omit<PatientHealthProfile, "patientId" | "updatedAt" | "rowVersion">;

export interface AddClinicalFileInput {
  clinicalEncounterId?: string;
  treatmentId?: string;
  appointmentId?: string;
  originalFilename: string;
  category: ClinicalFileCategory;
  mimeType: string;
  sizeBytes: number;
  radiographType?: string;
  toothNumber?: string;
  region?: string;
  laterality?: ClinicalFileLaterality;
  capturedAt?: string;
  notes?: string;
}

export interface ClinicalEncounterListFilters {
  status?: ClinicalEncounterStatus;
  practitionerMembershipId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CompleteClinicalEncounterVariables {
  encounterId: string;
  input: CompleteClinicalEncounterInput;
}

export interface VoidClinicalEncounterVariables {
  encounterId: string;
  input: VoidClinicalEncounterInput;
}

export interface AddClinicalEncounterProceduresVariables {
  encounterId: string;
  procedures: ClinicalEncounterProcedureDraft[];
}
