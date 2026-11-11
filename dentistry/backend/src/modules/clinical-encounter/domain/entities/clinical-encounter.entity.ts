export const CLINICAL_ENCOUNTER_STATUSES = [
  'IN_PROGRESS',
  'COMPLETED',
  'VOIDED',
] as const;
export type ClinicalEncounterStatus =
  (typeof CLINICAL_ENCOUNTER_STATUSES)[number];

export const PROCEDURE_TARGET_TYPES = [
  'TOOTH',
  'REGION',
  'WHOLE_MOUTH',
  'OTHER',
] as const;
export type ProcedureTargetType = (typeof PROCEDURE_TARGET_TYPES)[number];

export type ClinicalEncounterProcedureStatus = 'RECORDED' | 'VOIDED';

export type ClinicalEncounterProcedure = {
  id: string;
  clinicalEncounterId: string;
  targetType: ProcedureTargetType;
  toothNumber: string | null;
  targetDescription: string | null;
  description: string;
  treatmentProcedureId: string | null;
  status: ClinicalEncounterProcedureStatus;
  voidedAt: Date | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
};

export type ClinicalEncounter = {
  id: string;
  organizationId: string;
  patientId: string;
  branchId: string;
  branchName: string | null;
  practitionerMembershipId: string;
  practitionerName: string | null;
  appointmentId: string | null;
  treatmentId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  chiefComplaint: string | null;
  examinationSummary: string | null;
  diagnosisSummary: string | null;
  procedureSummary: string | null;
  progressNotes: string | null;
  patientInstructions: string | null;
  notes: string | null;
  status: ClinicalEncounterStatus;
  completedAt: Date | null;
  completedByMembershipId: string | null;
  completedByName: string | null;
  voidedAt: Date | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
  rowVersion: number;
  procedures: ClinicalEncounterProcedure[];
};

/** Campos narrativos opcionales de la atención. */
export const ENCOUNTER_TEXT_FIELDS = [
  'chiefComplaint',
  'examinationSummary',
  'diagnosisSummary',
  'procedureSummary',
  'progressNotes',
  'patientInstructions',
  'notes',
] as const;
export type EncounterTextField = (typeof ENCOUNTER_TEXT_FIELDS)[number];
export type EncounterTexts = Record<EncounterTextField, string | null>;

/**
 * Numeración FDI: permanentes 11–48 y temporales 51–85. Debe coincidir con la
 * validación del frontend (`utils/procedures.ts`).
 */
export const FDI_TOOTH_PATTERN =
  /^(1[1-8]|2[1-8]|3[1-8]|4[1-8]|5[1-5]|6[1-5]|7[1-5]|8[1-5])$/;
