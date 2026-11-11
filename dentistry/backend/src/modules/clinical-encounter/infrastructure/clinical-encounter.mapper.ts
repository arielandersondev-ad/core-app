import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
  ClinicalEncounterProcedureStatus,
  ClinicalEncounterStatus,
  ProcedureTargetType,
} from '../domain/entities/clinical-encounter.entity.js';
import type { PatientHealthProfile } from '../domain/entities/patient-health-profile.entity.js';

export interface ClinicalEncounterRow {
  id: string;
  organizationId: string;
  patientId: string;
  branchId: string;
  practitionerMembershipId: string;
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
  status: string;
  completedAt: Date | null;
  completedByMembershipId: string | null;
  voidedAt: Date | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
  rowVersion: number;
}

export interface ClinicalEncounterProcedureRow {
  id: string;
  clinicalEncounterId: string;
  targetType: string;
  toothNumber: string | null;
  targetDescription: string | null;
  description: string;
  treatmentProcedureId: string | null;
  status: string;
  voidedAt: Date | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
}

export interface PatientHealthProfileRow {
  patientId: string;
  medicalHistory: string | null;
  allergies: string | null;
  currentMedications: string | null;
  dentalHistory: string | null;
  relevantConditions: string | null;
  observations: string | null;
  updatedAt: Date;
  rowVersion: number;
}

/** Nombres de presentación resueltos desde Core por id (sin FK cruzada). */
export type EncounterNames = {
  branches: Map<string, string>;
  memberships: Map<string, string>;
};

export function toProcedureEntity(
  row: ClinicalEncounterProcedureRow,
): ClinicalEncounterProcedure {
  return {
    id: row.id,
    clinicalEncounterId: row.clinicalEncounterId,
    targetType: row.targetType as ProcedureTargetType,
    toothNumber: row.toothNumber,
    targetDescription: row.targetDescription,
    description: row.description,
    treatmentProcedureId: row.treatmentProcedureId,
    status: row.status as ClinicalEncounterProcedureStatus,
    voidedAt: row.voidedAt,
    voidedByMembershipId: row.voidedByMembershipId,
    voidReason: row.voidReason,
  };
}

export function toEncounterEntity(
  row: ClinicalEncounterRow,
  procedures: ClinicalEncounterProcedureRow[],
  names: EncounterNames,
): ClinicalEncounter {
  return {
    id: row.id,
    organizationId: row.organizationId,
    patientId: row.patientId,
    branchId: row.branchId,
    branchName: names.branches.get(row.branchId) ?? null,
    practitionerMembershipId: row.practitionerMembershipId,
    practitionerName: names.memberships.get(row.practitionerMembershipId) ?? null,
    appointmentId: row.appointmentId,
    treatmentId: row.treatmentId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    chiefComplaint: row.chiefComplaint,
    examinationSummary: row.examinationSummary,
    diagnosisSummary: row.diagnosisSummary,
    procedureSummary: row.procedureSummary,
    progressNotes: row.progressNotes,
    patientInstructions: row.patientInstructions,
    notes: row.notes,
    status: row.status as ClinicalEncounterStatus,
    completedAt: row.completedAt,
    completedByMembershipId: row.completedByMembershipId,
    completedByName: row.completedByMembershipId
      ? (names.memberships.get(row.completedByMembershipId) ?? null)
      : null,
    voidedAt: row.voidedAt,
    voidedByMembershipId: row.voidedByMembershipId,
    voidReason: row.voidReason,
    rowVersion: row.rowVersion,
    procedures: procedures.map(toProcedureEntity),
  };
}

export function toHealthProfileEntity(
  row: PatientHealthProfileRow,
): PatientHealthProfile {
  return {
    patientId: row.patientId,
    medicalHistory: row.medicalHistory,
    allergies: row.allergies,
    currentMedications: row.currentMedications,
    dentalHistory: row.dentalHistory,
    relevantConditions: row.relevantConditions,
    observations: row.observations,
    updatedAt: row.updatedAt,
    rowVersion: row.rowVersion,
  };
}
