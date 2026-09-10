import { IsISO8601, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  branchId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  professionalMembershipId: string;

  @IsUUID()
  serviceId: string;

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsUUID()
  createdByMembershipId: string;
}
