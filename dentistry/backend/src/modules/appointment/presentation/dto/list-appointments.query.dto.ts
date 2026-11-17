import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsUUID('all')
  branchId?: string;

  @IsOptional()
  @IsUUID('all')
  patientId?: string;

  @IsOptional()
  @IsUUID('all')
  practitionerMembershipId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
