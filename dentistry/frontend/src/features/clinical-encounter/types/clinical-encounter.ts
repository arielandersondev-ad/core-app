export type ClinicalEncounterStatus = "IN_PROGRESS" | "COMPLETED" | "VOIDED";
export type ClinicalEncounterTargetType = "TOOTH" | "REGION" | "WHOLE_MOUTH" | "OTHER";
export type ClinicalEncounterProcedureStatus = "RECORDED" | "VOIDED";
export type ClinicalFileCategory = "RADIOGRAPH" | "PHOTO" | "DOCUMENT" | "OTHER";
export type ClinicalFileUploadStatus = "PENDING" | "READY" | "FAILED";

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

/** Archivo del historial clínico; la API no expone su ubicación en el almacenamiento. */
export interface ClinicalFile {
  id: string;
  patientId: string;
  clinicalEncounterId?: string;
  originalFilename: string;
  category: ClinicalFileCategory;
  mimeType: string;
  sizeBytes: number;
  capturedAt?: string;
  description?: string;
  uploadStatus: ClinicalFileUploadStatus;
  uploadedAt?: string;
  uploadedByMembershipId: string;
  createdAt: string;
}

/** Uso y límites de archivos de la organización (`GET /clinical-files/quota`). */
export interface ClinicalFileQuota {
  usedBytes: number;
  limitBytes: number | null;
  filesPerPatient: number | null;
  maxFileBytes: number;
  allowedMimeTypes: string[];
  storageAvailable: boolean;
}

/** Solicitud firmada de corta duración emitida por el backend. */
export interface SignedRequest {
  url: string;
  method: "PUT" | "GET";
  headers: Record<string, string>;
  expiresAt: string;
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

/** "Atención rápida": procedimientos sueltos registrados como atención completada. */
export interface RegisterQuickProcedureInput {
  branchId: string;
  /** Instante ISO en que se realizó; si se omite, el backend usa la hora actual. */
  performedAt?: string;
  appointmentId?: string;
  procedureSummary?: string | null;
  procedures: Omit<ClinicalEncounterProcedureDraft, "treatmentProcedureId">[];
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
  file: File;
  category: ClinicalFileCategory;
  clinicalEncounterId?: string;
  description?: string;
  /** Instante ISO con zona de la captura clínica, si se conoce. */
  capturedAt?: string;
  /** Progreso de la transferencia al almacenamiento, entre 0 y 1. */
  onProgress?: (fraction: number) => void;
}

export interface ClinicalEncounterListFilters {
  status?: ClinicalEncounterStatus;
  practitionerMembershipId?: string;
  /** Atención de una cita: a lo sumo una, incluida la anulada. */
  appointmentId?: string;
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
