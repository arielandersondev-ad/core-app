import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { Appointment } from '../domain/entities/appointment.entity.js';
import {
  AppointmentRepository,
  AppointmentReferences,
  CheckOverlapParams,
  FindAppointmentsFilters,
} from '../domain/repositories/appointment.repository.js';
import { AppointmentRow, toAppointmentEntity } from './appointment.mapper.js';

@Injectable()
export class PrismaAppointmentRepository extends AppointmentRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const row = (await this.prisma.orm.dentistry.Appointment.create({
      organizationId: toUuid36(appointment.organizationId),
      branchId: toUuid36(appointment.branchId),
      patientId: toUuid36(appointment.patientId),
      practitionerMembershipId: toUuid36(appointment.practitionerMembershipId),
      serviceId: toUuid36(appointment.serviceId),
      treatmentId: appointment.treatmentId ? toUuid36(appointment.treatmentId) : null,
      scheduledStartAt: appointment.scheduledStartAt,
      scheduledEndAt: appointment.scheduledEndAt,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      createdByMembershipId: toUuid36(appointment.createdByMembershipId),
    })) as unknown as AppointmentRow;

    // Create AppointmentService rows for all services
    const servicesToLink =
      appointment.serviceIds.length > 0
        ? appointment.serviceIds
        : [appointment.serviceId];

    for (const sId of servicesToLink) {
      if (sId) {
        await this.prisma.orm.dentistry.AppointmentService.create({
          organizationId: toUuid36(appointment.organizationId),
          appointmentId: toUuid36(row.id),
          serviceId: toUuid36(sId),
        });
      }
    }

    const created = await this.findById(row.id, appointment.organizationId);
    return created!;
  }

  async findById(id: string, organizationId: string): Promise<Appointment | null> {
    const row = (await this.prisma.orm.dentistry.Appointment.first({
      id: toUuid36(id),
      organizationId: toUuid36(organizationId),
    })) as unknown as AppointmentRow | null;

    if (!row) {
      return null;
    }

    const apptServices = (await this.prisma.orm.dentistry.AppointmentService.where({
      appointmentId: toUuid36(id),
    }).all()) as unknown as AppointmentRow['services'];

    row.services = apptServices || [];

    return toAppointmentEntity(row);
  }

  async findByFilters(filters: FindAppointmentsFilters): Promise<Appointment[]> {
    const rows = (await this.prisma.orm.dentistry.Appointment.where({
      organizationId: toUuid36(filters.organizationId),
    }).all()) as unknown as AppointmentRow[];

    const allApptServices = (await this.prisma.orm.dentistry.AppointmentService.where({
      organizationId: toUuid36(filters.organizationId),
    }).all()) as unknown as AppointmentRow['services'];

    const servicesByAppt = new Map<string, any[]>();
    for (const s of allApptServices || []) {
      if (!servicesByAppt.has(s.appointmentId)) {
        servicesByAppt.set(s.appointmentId, []);
      }
      servicesByAppt.get(s.appointmentId)!.push(s);
    }

    return rows
      .filter((row) => {
        if (!filters.authorizedBranchIds.includes(row.branchId)) return false;
        if (filters.branchId && row.branchId !== filters.branchId) return false;
        if (filters.patientId && row.patientId !== filters.patientId) return false;
        if (
          filters.practitionerMembershipId &&
          row.practitionerMembershipId !== filters.practitionerMembershipId
        )
          return false;
        if (filters.status && row.status !== filters.status) return false;
        if (filters.startDate) {
          const rowStart = new Date(row.scheduledStartAt);
          if (rowStart < filters.startDate) return false;
        }
        if (filters.endDate) {
          const rowStart = new Date(row.scheduledStartAt);
          if (rowStart > filters.endDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .map((r) => {
        r.services = servicesByAppt.get(r.id) || [];
        return toAppointmentEntity(r);
      });
  }

  async hasOverlap(params: CheckOverlapParams): Promise<boolean> {
    const rows = (await this.prisma.orm.dentistry.Appointment.where({
      organizationId: toUuid36(params.organizationId),
      practitionerMembershipId: toUuid36(params.practitionerMembershipId),
    }).all()) as unknown as AppointmentRow[];

    return rows.some((row) => {
      if (row.status === 'CANCELED') return false;
      if (params.excludeAppointmentId && row.id === params.excludeAppointmentId) return false;
      const rowStart = new Date(row.scheduledStartAt).getTime();
      const rowEnd = new Date(row.scheduledEndAt).getTime();
      const newStart = params.scheduledStartAt.getTime();
      const newEnd = params.scheduledEndAt.getTime();
      return rowStart < newEnd && rowEnd > newStart;
    });
  }

  async referencesBelongToOrganization(params: AppointmentReferences): Promise<boolean> {
    const organizationId = toUuid36(params.organizationId);
    const [patient, service, treatment] = await Promise.all([
      this.prisma.orm.dentistry.Patient.first({
        id: toUuid36(params.patientId), organizationId, deleted: false,
      }),
      this.prisma.orm.dentistry.DentalService.first({
        id: toUuid36(params.serviceId), organizationId, isActive: true,
      }),
      params.treatmentId
        ? this.prisma.orm.dentistry.Treatment.first({
            id: toUuid36(params.treatmentId), organizationId,
            patientId: toUuid36(params.patientId), serviceId: toUuid36(params.serviceId),
          })
        : Promise.resolve(true),
    ]);
    return Boolean(patient && service && treatment);
  }

  async update(appointment: Appointment, organizationId: string): Promise<Appointment | null> {
    await this.prisma.orm.dentistry.Appointment.where({
      id: toUuid36(appointment.id),
      organizationId: toUuid36(organizationId),
    }).update({
      status: appointment.status,
      notes: appointment.notes,
      canceledAt: appointment.canceledAt,
      canceledByMembershipId: appointment.canceledByMembershipId
        ? toUuid36(appointment.canceledByMembershipId)
        : null,
      cancellationReason: appointment.cancellationReason,
      updatedAt: new Date(),
    });

    return this.findById(appointment.id, organizationId);
  }
}

