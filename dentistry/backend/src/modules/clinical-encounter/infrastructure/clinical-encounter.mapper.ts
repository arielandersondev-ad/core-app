import { ClinicalEncounter } from '../domain/entities/clinical-encounter.entity.js';

export interface ClinicalEncounterRow {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  appointmentId: string | null;
  treatmentId: string | null;
  professionalMembershipId: string;
  startedAt: Date;
  endedAt: Date | null;
  chiefComplaint: string | null;
  diagnosis: string | null;
  procedurePerformed: string | null;
  evolution: string | null;
  recommendations: string | null;
  notes: string | null;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toClinicalEncounterEntity(row: ClinicalEncounterRow): ClinicalEncounter {
  return new ClinicalEncounter({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    patientId: row.patientId,
    appointmentId: row.appointmentId,
    treatmentId: row.treatmentId,
    professionalMembershipId: row.professionalMembershipId,
    startedAt: row.startedAt,
    endedAt: row.endedAt,
    chiefComplaint: row.chiefComplaint,
    diagnosis: row.diagnosis,
    procedurePerformed: row.procedurePerformed,
    evolution: row.evolution,
    recommendations: row.recommendations,
    notes: row.notes,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}