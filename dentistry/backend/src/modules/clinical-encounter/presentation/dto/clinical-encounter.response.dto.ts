import type {
  ClinicalEncounter,
  ClinicalEncounterProcedure,
} from '../../domain/entities/clinical-encounter.entity.js';

export class ClinicalEncounterProcedureResponseDto {
  id: string;
  clinicalEncounterId: string;
  targetType: string;
  toothNumber: string | null;
  targetDescription: string | null;
  description: string;
  treatmentProcedureId: string | null;
  status: string;
  voidedAt: string | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;

  static fromEntity(
    procedure: ClinicalEncounterProcedure,
  ): ClinicalEncounterProcedureResponseDto {
    const dto = new ClinicalEncounterProcedureResponseDto();
    dto.id = procedure.id;
    dto.clinicalEncounterId = procedure.clinicalEncounterId;
    dto.targetType = procedure.targetType;
    dto.toothNumber = procedure.toothNumber;
    dto.targetDescription = procedure.targetDescription;
    dto.description = procedure.description;
    dto.treatmentProcedureId = procedure.treatmentProcedureId;
    dto.status = procedure.status;
    dto.voidedAt = procedure.voidedAt?.toISOString() ?? null;
    dto.voidedByMembershipId = procedure.voidedByMembershipId;
    dto.voidReason = procedure.voidReason;
    return dto;
  }
}

/** Representación 2.0 del contrato (`clinical-encounter-api-requirements.md`). */
export class ClinicalEncounterResponseDto {
  id: string;
  patientId: string;
  branchId: string;
  branchName: string | null;
  practitionerMembershipId: string;
  practitionerName: string | null;
  startedAt: string;
  endedAt: string | null;
  chiefComplaint: string | null;
  examinationSummary: string | null;
  diagnosisSummary: string | null;
  procedureSummary: string | null;
  progressNotes: string | null;
  patientInstructions: string | null;
  notes: string | null;
  status: string;
  appointmentId: string | null;
  treatmentId: string | null;
  completedAt: string | null;
  completedByMembershipId: string | null;
  completedByName: string | null;
  voidedAt: string | null;
  voidedByMembershipId: string | null;
  voidReason: string | null;
  rowVersion: number;
  procedures: ClinicalEncounterProcedureResponseDto[];

  static fromEntity(encounter: ClinicalEncounter): ClinicalEncounterResponseDto {
    const dto = new ClinicalEncounterResponseDto();
    dto.id = encounter.id;
    dto.patientId = encounter.patientId;
    dto.branchId = encounter.branchId;
    dto.branchName = encounter.branchName;
    dto.practitionerMembershipId = encounter.practitionerMembershipId;
    dto.practitionerName = encounter.practitionerName;
    dto.startedAt = encounter.startedAt.toISOString();
    dto.endedAt = encounter.endedAt?.toISOString() ?? null;
    dto.chiefComplaint = encounter.chiefComplaint;
    dto.examinationSummary = encounter.examinationSummary;
    dto.diagnosisSummary = encounter.diagnosisSummary;
    dto.procedureSummary = encounter.procedureSummary;
    dto.progressNotes = encounter.progressNotes;
    dto.patientInstructions = encounter.patientInstructions;
    dto.notes = encounter.notes;
    dto.status = encounter.status;
    dto.appointmentId = encounter.appointmentId;
    dto.treatmentId = encounter.treatmentId;
    dto.completedAt = encounter.completedAt?.toISOString() ?? null;
    dto.completedByMembershipId = encounter.completedByMembershipId;
    dto.completedByName = encounter.completedByName;
    dto.voidedAt = encounter.voidedAt?.toISOString() ?? null;
    dto.voidedByMembershipId = encounter.voidedByMembershipId;
    dto.voidReason = encounter.voidReason;
    dto.rowVersion = encounter.rowVersion;
    dto.procedures = encounter.procedures.map(
      ClinicalEncounterProcedureResponseDto.fromEntity,
    );
    return dto;
  }
}
