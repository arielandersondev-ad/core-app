export type EncounterStatus = "IN_PROGRESS" | "COMPLETED" | "VOIDED";
export type TargetType = "TOOTH" | "REGION" | "WHOLE_MOUTH" | "OTHER";

export interface EncounterProcedure {
  id: string;
  targetType: TargetType;
  toothNumber?: string;
  targetDescription?: string;
  description: string;
  treatmentProcedureId?: string;
}

export interface ClinicalEncounter {
  id: string;
  patientId: string;
  branchName: string;
  professionalName: string;
  startedAt: string;
  endedAt?: string;
  examinationSummary: string;
  procedureSummary?: string;
  clinicalNotes?: string;
  status: EncounterStatus;
  appointmentId?: string;
  treatmentId?: string;
  procedures: EncounterProcedure[];
  completedBy?: string;
  voidReason?: string;
}

export interface HealthProfile {
  medicalHistory: string;
  allergies: string;
  currentMedications: string;
  dentalHistory: string;
  relevantConditions: string;
  observations: string;
}

export interface ClinicalFile {
  id: string;
  name: string;
  category: "RADIOGRAPH" | "ATTACHMENT";
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  radiographType?: string;
  toothNumber?: string;
  region?: string;
  side?: string;
  notes?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: string;
  phone: string;
  email: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
}