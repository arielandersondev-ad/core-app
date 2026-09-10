import { Injectable } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import {
  AppointmentRepository,
  FindAppointmentsFilters,
} from '../../domain/repositories/appointment.repository.js';

@Injectable()
export class ListAppointmentsUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(filters: FindAppointmentsFilters): Promise<Appointment[]> {
    return this.appointmentRepository.findByFilters(filters);
  }
}
