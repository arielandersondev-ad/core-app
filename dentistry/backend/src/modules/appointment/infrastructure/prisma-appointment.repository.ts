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
    const row = await this.prisma.orm.dentistry.Appointment.create({
      organizationId: toUuid36(appointment.organizationId),
      branchId: toUuid36(appointment.branchId),
      patientId: toUuid36(appointment.patientId),
      professionalMembershipId: toUuid36(appointment.professionalMembershipId),
      serviceId: toUuid36(appointment.serviceId),
      treatmentId: appointment.treatmentId ? toUuid36(appointment.treatmentId) : null,
      startsAt: appointment.startsAt,
      endsAt: appointment.endsAt,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      createdByMembershipId: toUuid36(appointment.createdByMembershipId),
    });

    return toAppointmentEntity(row as unknown as AppointmentRow);
  }

  async findById(id: string, organizationId: string): Promise<Appointment | null> {
    const row = await this.prisma.orm.dentistry.Appointment.first({
      id: toUuid36(id),
      organizationId: toUuid36(organizationId),
    });

    if (!row) {
      return null;
    }

    return toAppointmentEntity(row as unknown as AppointmentRow);
  }

  async findByFilters(filters: FindAppointmentsFilters): Promise<Appointment[]> {
    const rows = (await this.prisma.orm.dentistry.Appointment.where({
      organizationId: toUuid36(filters.organizationId),
    }).all()) as unknown as AppointmentRow[];

    return rows
      .filter((row) => {
        if (!filters.authorizedBranchIds.includes(row.branchId)) return false;
        if (filters.branchId && row.branchId !== filters.branchId) return false;
        if (filters.patientId && row.patientId !== filters.patientId) return false;
        if (
          filters.professionalMembershipId &&
          row.professionalMembershipId !== filters.professionalMembershipId
        )
          return false;
        if (filters.status && row.status !== filters.status) return false;
        if (filters.startDate) {
          const rowStart = new Date(row.startsAt);
          if (rowStart < filters.startDate) return false;
        }
        if (filters.endDate) {
          const rowStart = new Date(row.startsAt);
          if (rowStart > filters.endDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .map(toAppointmentEntity);
  }

  async hasOverlap(params: CheckOverlapParams): Promise<boolean> {
    const rows = (await this.prisma.orm.dentistry.Appointment.where({
      organizationId: toUuid36(params.organizationId),
      professionalMembershipId: toUuid36(params.professionalMembershipId),
    }).all()) as unknown as AppointmentRow[];

    return rows.some((row) => {
      if (row.status === 'CANCELLED') return false;
      if (params.excludeAppointmentId && row.id === params.excludeAppointmentId) return false;
      const rowStart = new Date(row.startsAt).getTime();
      const rowEnd = new Date(row.endsAt).getTime();
      const newStart = params.startsAt.getTime();
      const newEnd = params.endsAt.getTime();
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
        id: toUuid36(params.serviceId), organizationId, active: true,
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
      cancelledAt: appointment.cancelledAt,
      cancelledByMembershipId: appointment.cancelledByMembershipId
        ? toUuid36(appointment.cancelledByMembershipId)
        : null,
      cancellationReason: appointment.cancellationReason,
      updatedAt: new Date(),
    });

    return this.findById(appointment.id, organizationId);
  }
}
