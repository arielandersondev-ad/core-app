import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';

export class ListClinicalEncountersQueryDto {
  @IsUUID()
  organizationId: string;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsUUID()
  professionalMembershipId?: string;

  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  // El estado se deriva de endedAt: no existe columna status en el contrato.
  @IsOptional()
  @IsIn(['IN_PROGRESS', 'COMPLETED'])
  status?: string;
}