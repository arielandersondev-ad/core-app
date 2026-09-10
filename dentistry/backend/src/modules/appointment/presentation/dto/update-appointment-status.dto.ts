import { IsIn, IsOptional, IsString } from 'class-validator';
import type { AppointmentStatus } from '../../domain/entities/appointment.entity.js';

export class UpdateAppointmentStatusDto {
  @IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'])
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
