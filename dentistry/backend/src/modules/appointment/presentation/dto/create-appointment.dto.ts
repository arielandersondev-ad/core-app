import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  branchId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  practitionerMembershipId: string;

  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsUUID()
  treatmentId?: string;

  @IsISO8601()
  scheduledStartAt: string;

  @IsISO8601()
  scheduledEndAt: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
