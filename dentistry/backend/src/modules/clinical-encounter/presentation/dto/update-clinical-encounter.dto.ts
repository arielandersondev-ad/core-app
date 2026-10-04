import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateClinicalEncounterDto {
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
  updatedByMembershipId: string;
}