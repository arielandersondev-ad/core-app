import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface CancelAppointmentCommand {
  id: string;
  organizationId: string;
  authorizedBranchIds: string[];
  cancelledByMembershipId: string;
  reason: string;
}

@Injectable()
export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: CancelAppointmentCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(command.id, command.organizationId);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    }

    if (!command.authorizedBranchIds.includes(appointment.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }
    appointment.cancel(command.cancelledByMembershipId, command.reason);

    const updated = await this.appointmentRepository.update(appointment, command.organizationId);
    if (!updated) throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    return updated;
  }
}
