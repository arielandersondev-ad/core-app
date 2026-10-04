import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateClinicalEncounterDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  professionalMembershipId: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsISO8601()
  startedAt: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  procedurePerformed?: string;

  @IsOptional()
  @IsString()
  evolution?: string;

  @IsOptional()
  @IsString()
  recommendations?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  createdByMembershipId: string;
}