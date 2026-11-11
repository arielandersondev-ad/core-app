import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../../common/presentation/dto/pagination.query.dto.js';
import {
  CLINICAL_ENCOUNTER_STATUSES,
  PROCEDURE_TARGET_TYPES,
  type ClinicalEncounterStatus,
  type ProcedureTargetType,
} from '../../domain/entities/clinical-encounter.entity.js';

export class ListClinicalEncountersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(CLINICAL_ENCOUNTER_STATUSES)
  status?: ClinicalEncounterStatus;

  @IsOptional()
  @IsUUID('all')
  practitionerMembershipId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class CreateClinicalEncounterDto {
  @IsUUID('all')
  patientId: string;

  @IsUUID('all')
  branchId: string;

  @IsISO8601({ strict: true })
  startedAt: string;

  @IsOptional()
  @IsUUID('all')
  appointmentId?: string;

  @IsOptional()
  @IsUUID('all')
  treatmentId?: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string | null;

  @IsOptional()
  @IsString()
  examinationSummary?: string | null;

  @IsOptional()
  @IsString()
  diagnosisSummary?: string | null;

  @IsOptional()
  @IsString()
  procedureSummary?: string | null;

  @IsOptional()
  @IsString()
  progressNotes?: string | null;

  @IsOptional()
  @IsString()
  patientInstructions?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class ProcedureDraftDto {
  @IsIn(PROCEDURE_TARGET_TYPES)
  targetType: ProcedureTargetType;

  @IsOptional()
  @IsString()
  toothNumber?: string | null;

  @IsOptional()
  @IsString()
  targetDescription?: string | null;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsUUID('all')
  treatmentProcedureId?: string | null;
}

export class AddClinicalEncounterProceduresDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProcedureDraftDto)
  procedures: ProcedureDraftDto[];
}

export class CompleteClinicalEncounterDto {
  @IsISO8601({ strict: true })
  endedAt: string;

  @IsOptional()
  @IsString()
  procedureSummary?: string | null;
}

export class VoidClinicalEncounterDto {
  @IsString()
  reason: string;
}
