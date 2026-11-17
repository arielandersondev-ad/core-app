import {
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Appointment } from '../../domain/entities/appointment.entity.js';
import { AppointmentRepository } from '../../domain/repositories/appointment.repository.js';

export interface CreateAppointmentCommand {
  organizationId: string;
  branchId: string;
  authorizedBranchIds: string[];
  patientId?: string;
  personId?: string;
  practitionerMembershipId?: string | null;
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
    // Sin un directorio confiable de profesionales, solo se permite autoasignación si se especifica un profesional.
    if (
      command.practitionerMembershipId &&
      command.practitionerMembershipId !== command.createdByMembershipId
    ) {
      throw new ForbiddenException('No puede asignar citas a otra membresía.');
    }
    if (
      Number.isNaN(command.scheduledStartAt?.getTime()) ||
      Number.isNaN(command.scheduledEndAt?.getTime()) ||
      command.scheduledStartAt >= command.scheduledEndAt
    ) {
      throw new BadRequestException(
        'La hora de inicio debe ser anterior a la hora de fin.',
      );
    }
    // Must have either patientId or personId
    if (!command.patientId && !command.personId) {
      throw new BadRequestException(
        'Debe especificar un paciente o una persona de contacto para la cita.',
      );
    }

    const serviceIds = [
      ...new Set([
        ...(command.serviceId ? [command.serviceId] : []),
        ...(command.serviceIds ?? []),
      ]),
    ];

    if (
      !(await this.appointmentRepository.referencesBelongToOrganization({
        organizationId: command.organizationId,
        patientId: command.patientId,
        personId: command.personId,
        serviceIds,
        treatmentId: command.treatmentId,
      }))
    ) {
      throw new BadRequestException(
        'Paciente, persona, servicio o tratamiento inválido para la organización.',
      );
    }

    // Comprobar que no exista solapamiento de horario para el profesional si se especificó uno
    if (command.practitionerMembershipId) {
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
    }

    const appointment = new Appointment({
      organizationId: command.organizationId,
      branchId: command.branchId,
      patientId: command.patientId,
      personId: command.personId,
      practitionerMembershipId: command.practitionerMembershipId ?? null,
      serviceIds,
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
