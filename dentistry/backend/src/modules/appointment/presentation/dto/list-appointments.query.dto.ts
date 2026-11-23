import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

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

  /** Día de calendario en la zona horaria de la sucursal de cada cita. */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener el formato YYYY-MM-DD' })
  @IsDateString({ strict: true })
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
