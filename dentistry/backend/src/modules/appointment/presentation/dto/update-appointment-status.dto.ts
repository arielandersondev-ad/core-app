import { IsIn, IsOptional, IsString } from 'class-validator';
import type { AppointmentStatus } from '../../domain/entities/appointment.entity.js';

export class UpdateAppointmentStatusDto {
  @IsIn([
    'SCHEDULED',
    'CONFIRMED',
    'WAITING_ROOM',
    'IN_PROGRESS',
    'COMPLETED',
    'NO_SHOW',
  ])
  status: AppointmentStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
