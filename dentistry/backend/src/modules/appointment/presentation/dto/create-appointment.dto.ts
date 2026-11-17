import {
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID('all')
  branchId: string;

  @IsOptional()
  @IsUUID('all')
  patientId?: string;

  @IsOptional()
  @IsUUID('all')
  personId?: string;

  @IsOptional()
  @IsUUID('all')
  practitionerMembershipId?: string;

  @IsOptional()
  @IsUUID('all')
  serviceId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds?: string[];

  @IsOptional()
  @IsUUID('all')
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
