import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface CreateAppointmentCommand {
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  serviceId: string;
  treatmentId?: string | null;
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
}

@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: CreateAppointmentCommand): Promise<Appointment> {
    if (command.startsAt >= command.endsAt) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin.');
    }

    // Comprobar que no exista solapamiento de horario para el profesional
    const hasOverlap = await this.appointmentRepository.hasOverlap({
      organizationId: command.organizationId,
      branchId: command.branchId,
      professionalMembershipId: command.professionalMembershipId,
      startsAt: command.startsAt,
      endsAt: command.endsAt,
    });

    if (hasOverlap) {
      throw new ConflictException(
        'El profesional ya cuenta con una cita programada en ese rango de horario.',
      );
    }

    const appointment = new Appointment({
      organizationId: command.organizationId,
      branchId: command.branchId,
      patientId: command.patientId,
      professionalMembershipId: command.professionalMembershipId,
      serviceId: command.serviceId,
      treatmentId: command.treatmentId,
      startsAt: command.startsAt,
      endsAt: command.endsAt,
      reason: command.reason,
      notes: command.notes,
      createdByMembershipId: command.createdByMembershipId,
      status: 'SCHEDULED',
    });

    return this.appointmentRepository.create(appointment);
  }
}
