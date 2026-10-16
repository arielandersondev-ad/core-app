import { Injectable, NotFoundException } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

@Injectable()
export class GetAppointmentByIdUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(id: string, organizationId: string, authorizedBranchIds: string[]): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(id, organizationId);
    if (!appointment) {
      throw new NotFoundException(`Cita con ID "${id}" no encontrada.`);
    }
    if (!authorizedBranchIds.includes(appointment.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }
    return appointment;
  }
}
