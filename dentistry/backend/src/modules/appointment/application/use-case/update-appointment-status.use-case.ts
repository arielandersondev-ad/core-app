import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Appointment, AppointmentStatus } from '../../domain/entities/appointment.entity.js';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface UpdateAppointmentStatusCommand {
  id: string;
  organizationId: string;
  authorizedBranchIds: string[];
  status: AppointmentStatus;
  notes?: string;
}

@Injectable()
export class UpdateAppointmentStatusUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: UpdateAppointmentStatusCommand): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(command.id, command.organizationId);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    }

    if (!command.authorizedBranchIds.includes(appointment.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }

    if (command.status === 'CONFIRMED') {
      appointment.confirm();
    } else if (command.status === 'WAITING_ROOM') {
      appointment.markInWaitingRoom();
    } else if (command.status === 'IN_PROGRESS') {
      appointment.start();
    } else if (command.status === 'COMPLETED') {
      appointment.complete();
    } else if (command.status === 'NO_SHOW') {
      appointment.markNoShow();
    } else if (command.status === 'SCHEDULED') {
      appointment.schedule();
    } else if (command.status === 'CANCELLED') {
      throw new BadRequestException(
        'Para cancelar una cita utilice el endpoint de cancelación.',
      );
    }

    if (command.notes !== undefined) {
      appointment.updateNotes(command.notes);
    }

    const updated = await this.appointmentRepository.update(appointment, command.organizationId);
    if (!updated) throw new NotFoundException(`Cita con ID "${command.id}" no encontrada.`);
    return updated;
  }
}
