import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

@Injectable()
export class GetAppointmentByIdUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${id}" no encontrada.`);
    }
    return appointment;
  }
}
