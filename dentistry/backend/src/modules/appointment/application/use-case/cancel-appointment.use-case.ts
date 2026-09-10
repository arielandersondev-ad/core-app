import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface CancelAppointmentCommand {
  id: string;
  cancelledByMembershipId: string;
  reason: string;
}

@Injectable()
export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: CancelAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(command.id);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    }

    appointment.cancel(command.cancelledByMembershipId, command.reason);

    return this.appointmentRepository.update(appointment);
  }
}
