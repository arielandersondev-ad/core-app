import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { Appointment } from '../domain/entities/appointment.entity.js';
import {
  AppointmentRepository,
  AppointmentReferences,
  CheckOverlapParams,
  FindAppointmentsFilters,
} from '../domain/repositories/appointment.repository.js';
import {
  AppointmentServiceRow,
  toAppointmentEntity,
} from './appointment.mapper.js';

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(appointment: Appointment): Promise<Appointment> {
    return this.prisma.transaction(async (tx) => {
      const row = await tx.orm.dentistry.Appointment.create({
        organizationId: appointment.organizationId,
        branchId: appointment.branchId,
        patientId: appointment.patientId,
        practitionerMembershipId: appointment.practitionerMembershipId,
        treatmentId: appointment.treatmentId,
        scheduledStartAt: appointment.scheduledStartAt,
        scheduledEndAt: appointment.scheduledEndAt,
        status: appointment.status,
        reason: appointment.reason,
        notes: appointment.notes,
        createdByMembershipId: appointment.createdByMembershipId,
      });
      const services: AppointmentServiceRow[] = [];
      for (const serviceId of appointment.serviceIds) {
        services.push(
          await tx.orm.dentistry.AppointmentService.create({
            organizationId: appointment.organizationId,
            appointmentId: row.id,
            serviceId,
          }),
        );
      }
      return toAppointmentEntity({ ...row, services });
    });
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<Appointment | null> {
    const row = await this.prisma.orm.dentistry.Appointment.first({
      id,
      organizationId,
    });
    if (!row) return null;
    const services = await this.prisma.orm.dentistry.AppointmentService.where({
      organizationId,
      appointmentId: id,
    }).all();
    return toAppointmentEntity({ ...row, services });
  }

  async findByFilters(
    filters: FindAppointmentsFilters,
  ): Promise<Appointment[]> {
    const rows = await this.prisma.orm.dentistry.Appointment.where({
      organizationId: filters.organizationId,
    }).all();
    const links = await this.prisma.orm.dentistry.AppointmentService.where({
      organizationId: filters.organizationId,
    }).all();
    const servicesByAppointment = new Map<string, AppointmentServiceRow[]>();
    for (const link of links) {
      const services = servicesByAppointment.get(link.appointmentId) ?? [];
      services.push(link);
      servicesByAppointment.set(link.appointmentId, services);
    }
    return rows
      .filter((row) => {
        if (!filters.authorizedBranchIds.includes(row.branchId)) return false;
        if (filters.branchId && row.branchId !== filters.branchId) return false;
        if (filters.patientId && row.patientId !== filters.patientId)
          return false;
        if (
          filters.practitionerMembershipId &&
          row.practitionerMembershipId !== filters.practitionerMembershipId
        )
          return false;
        if (filters.status && row.status !== filters.status) return false;
        if (filters.startDate && row.scheduledStartAt < filters.startDate)
          return false;
        if (filters.endDate && row.scheduledStartAt > filters.endDate)
          return false;
        return true;
      })
      .sort(
        (a, b) => a.scheduledStartAt.getTime() - b.scheduledStartAt.getTime(),
      )
      .map((row) =>
        toAppointmentEntity({
          ...row,
          services: servicesByAppointment.get(row.id) ?? [],
        }),
      );
  }

  async hasOverlap(params: CheckOverlapParams): Promise<boolean> {
    const rows = await this.prisma.orm.dentistry.Appointment.where({
      organizationId: params.organizationId,
      practitionerMembershipId: params.practitionerMembershipId,
    }).all();
    return rows.some(
      (row) =>
        row.status !== 'CANCELED' &&
        row.id !== params.excludeAppointmentId &&
        row.scheduledStartAt < params.scheduledEndAt &&
        row.scheduledEndAt > params.scheduledStartAt,
    );
  }

  async referencesBelongToOrganization(
    params: AppointmentReferences,
  ): Promise<boolean> {
    const { organizationId, patientId } = params;
    const patient = await this.prisma.orm.dentistry.Patient.first({
      id: patientId,
      organizationId,
      deletedAt: null,
    });
    if (!patient) return false;
    for (const id of params.serviceIds) {
      const service = await this.prisma.orm.dentistry.DentalService.first({
        id,
        organizationId,
        isActive: true,
      });
      if (!service) return false;
    }
    if (params.treatmentId) {
      const treatment = await this.prisma.orm.dentistry.Treatment.first({
        id: params.treatmentId,
        organizationId,
        patientId,
      });
      if (!treatment) return false;
    }
    return true;
  }

  async update(
    appointment: Appointment,
    organizationId: string,
  ): Promise<Appointment | null> {
    const row = await this.prisma.orm.dentistry.Appointment.where({
      id: appointment.id,
      organizationId,
      rowVersion: appointment.rowVersion,
    }).update({
      status: appointment.status,
      notes: appointment.notes,
      canceledAt: appointment.canceledAt,
      canceledByMembershipId: appointment.canceledByMembershipId,
      cancellationReason: appointment.cancellationReason,
      updatedByMembershipId: appointment.updatedByMembershipId,
      rowVersion: appointment.rowVersion + 1,
    });
    if (!row)
      throw new ConflictException(
        'La cita cambió; vuelva a cargarla antes de actualizarla.',
      );
    return this.findById(appointment.id, organizationId);
  }
}
