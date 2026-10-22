import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { ForbiddenException } from '@nestjs/common';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface CreateAppointmentCommand {
  organizationId: string;
  branchId: string;
  authorizedBranchIds: string[];
  patientId: string;
  practitionerMembershipId: string;
  serviceId?: string;
  serviceIds?: string[];
  treatmentId?: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  reason?: string | null;
  notes?: string | null;
  createdByMembershipId: string;
}

@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute(command: CreateAppointmentCommand): Promise<Appointment> {
    if (!command.authorizedBranchIds.includes(command.branchId)) {
      throw new ForbiddenException('No tiene acceso a la sucursal indicada.');
    }
    // Sin un directorio confiable de profesionales, solo se permite autoasignación.
    if (command.practitionerMembershipId !== command.createdByMembershipId) {
      throw new ForbiddenException('No puede asignar citas a otra membresía.');
    }
    if (command.scheduledStartAt >= command.scheduledEndAt) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin.',
      );
    }

    if (
      !command.serviceId &&
      (!command.serviceIds || command.serviceIds.length === 0)
    ) {
      throw new BadRequestException(
        'Debe seleccionar al menos un servicio para la cita.',
      );
    }

    const effectiveServiceId =
      command.serviceId || command.serviceIds?.[0] || '';

    if (
      !(await this.appointmentRepository.referencesBelongToOrganization({
        organizationId: command.organizationId,
        patientId: command.patientId,
        serviceId: effectiveServiceId,
        treatmentId: command.treatmentId,
      }))
    ) {
      throw new BadRequestException('Paciente, servicio o tratamiento inválido para la organización.');
    }

    // Comprobar que no exista solapamiento de horario para el profesional
    const hasOverlap = await this.appointmentRepository.hasOverlap({
      organizationId: command.organizationId,
      branchId: command.branchId,
      practitionerMembershipId: command.practitionerMembershipId,
      scheduledStartAt: command.scheduledStartAt,
      scheduledEndAt: command.scheduledEndAt,
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
      practitionerMembershipId: command.practitionerMembershipId,
      serviceId: command.serviceId,
      serviceIds: command.serviceIds,
      treatmentId: command.treatmentId,
      scheduledStartAt: command.scheduledStartAt,
      scheduledEndAt: command.scheduledEndAt,
      reason: command.reason,
      notes: command.notes,
      createdByMembershipId: command.createdByMembershipId,
      status: 'SCHEDULED',
    });

    return this.appointmentRepository.create(appointment);
  }
}
