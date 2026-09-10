import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../../domain/entities/appointment.entity.js';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface UpdateAppointmentStatusCommand {
  id: string;
  status: AppointmentStatus;
  notes?: string;
}

@Injectable()
export class UpdateAppointmentStatusUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: UpdateAppointmentStatusCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(command.id);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    }

    if (command.status === 'IN_PROGRESS') {
      appointment.start();
    } else if (command.status === 'COMPLETED') {
      appointment.complete();
    } else if (command.status === 'CANCELLED') {
      throw new BadRequestException('Para cancelar una cita utilice el endpoint de cancelación.');
    }

    if (command.notes !== undefined) {
      appointment.updateNotes(command.notes);
    }

    return this.appointmentRepository.update(appointment);
  }
}
