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
        patientId: appointment.patientId ?? '',
        personId: appointment.personId || undefined,
        practitionerMembershipId: appointment.practitionerMembershipId ?? null,
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
      return toAppointmentEntity({
        ...row,
        personId: (row as any).personId ?? appointment.personId,
        services,
        patientName: appointment.patientName ?? null,
        patientPhone: appointment.patientPhone ?? null,
        personName: appointment.personName ?? null,
        personPhone: appointment.personPhone ?? null,
        serviceName: appointment.serviceName ?? null,
      });
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

    const [services, patient, person, dentalServices] = await Promise.all([
      this.prisma.orm?.dentistry?.AppointmentService?.where
        ? this.prisma.orm.dentistry.AppointmentService.where({
            organizationId,
            appointmentId: id,
          }).all()
        : Promise.resolve([]),
      row.patientId && this.prisma.orm?.dentistry?.Patient?.first
        ? this.prisma.orm.dentistry.Patient.first({
            id: row.patientId,
            organizationId,
          })
        : Promise.resolve(null),
      (row as any).personId && this.prisma.orm?.dentistry?.Person?.first
        ? this.prisma.orm.dentistry.Person.first({
            id: (row as any).personId,
            organizationId,
          })
        : Promise.resolve(null),
      this.prisma.orm?.dentistry?.DentalService?.where
        ? this.prisma.orm.dentistry.DentalService.where({
            organizationId,
          }).all()
        : Promise.resolve([]),
    ]);

    const serviceMap = new Map<string, string>();
    for (const ds of dentalServices || []) {
      serviceMap.set(ds.id, ds.name);
    }

    const enrichedServices: AppointmentServiceRow[] = (services || []).map(
      (s) => ({
        ...s,
        service: serviceMap.has(s.serviceId)
          ? { name: serviceMap.get(s.serviceId)! }
          : undefined,
      }),
    );

    const patientName = patient
      ? `${patient.firstName ?? ''} ${patient.lastName ?? ''}`.trim() || null
      : null;
    const patientPhone =
      patient?.phone && patient.phone.trim() ? patient.phone.trim() : null;

    const personName = person
      ? ((person as any).fullName?.trim() ||
          `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim()) ||
        null
      : null;
    const personPhone =
      person?.phone && person.phone.trim() ? person.phone.trim() : null;

    const primaryServiceName =
      enrichedServices[0]?.service?.name ??
      (services?.[0] ? serviceMap.get(services[0].serviceId) : null) ??
      ((row as any).serviceId ? serviceMap.get((row as any).serviceId) : null) ??
      null;

    return toAppointmentEntity({
      ...row,
      services: enrichedServices,
      patientName,
      patientPhone,
      personName,
      personPhone,
      serviceName: primaryServiceName,
    });
  }

  async findByFilters(
    filters: FindAppointmentsFilters,
  ): Promise<Appointment[]> {
    const [rows, links, patients, persons, dentalServices] = await Promise.all([
      this.prisma.orm.dentistry.Appointment.where({
        organizationId: filters.organizationId,
      }).all(),
      this.prisma.orm?.dentistry?.AppointmentService?.where
        ? this.prisma.orm.dentistry.AppointmentService.where({
            organizationId: filters.organizationId,
          }).all()
        : Promise.resolve([]),
      this.prisma.orm?.dentistry?.Patient?.where
        ? this.prisma.orm.dentistry.Patient.where({
            organizationId: filters.organizationId,
          }).all()
        : Promise.resolve([]),
      this.prisma.orm?.dentistry?.Person?.where
        ? this.prisma.orm.dentistry.Person.where({
            organizationId: filters.organizationId,
          }).all()
        : Promise.resolve([]),
      this.prisma.orm?.dentistry?.DentalService?.where
        ? this.prisma.orm.dentistry.DentalService.where({
            organizationId: filters.organizationId,
          }).all()
        : Promise.resolve([]),
    ]);

    const patientMap = new Map<string, { name: string; phone: string | null }>();
    for (const p of patients || []) {
      const name = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || null;
      const phone = p.phone && p.phone.trim() ? p.phone.trim() : null;
      if (name || phone) {
        patientMap.set(p.id, { name: name ?? '', phone });
      }
    }

    const personMap = new Map<string, { name: string; phone: string | null }>();
    for (const p of persons || []) {
      const name =
        ((p as any).fullName?.trim() ||
          `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()) ||
        null;
      const phone = p.phone && p.phone.trim() ? p.phone.trim() : null;
      if (name || phone) {
        personMap.set(p.id, { name: name ?? '', phone });
      }
    }

    const serviceMap = new Map<string, string>();
    for (const s of dentalServices || []) {
      serviceMap.set(s.id, s.name);
    }

    const servicesByAppointment = new Map<string, AppointmentServiceRow[]>();
    for (const link of links || []) {
      const services = servicesByAppointment.get(link.appointmentId) ?? [];
      services.push({
        ...link,
        service: serviceMap.has(link.serviceId)
          ? { name: serviceMap.get(link.serviceId)! }
          : undefined,
      });
      servicesByAppointment.set(link.appointmentId, services);
    }

    return (rows || [])
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
      .map((row) => {
        const apptServices = servicesByAppointment.get(row.id) ?? [];
        const patientInfo = row.patientId ? patientMap.get(row.patientId) : undefined;
        const personId = (row as any).personId;
        const personInfo = personId ? personMap.get(personId) : undefined;
        const primaryServiceName =
          apptServices[0]?.service?.name ??
          (apptServices[0] ? serviceMap.get(apptServices[0].serviceId) : null) ??
          ((row as any).serviceId ? serviceMap.get((row as any).serviceId) : null) ??
          null;

        return toAppointmentEntity({
          ...row,
          services: apptServices,
          patientName: patientInfo?.name ?? null,
          patientPhone: patientInfo?.phone ?? null,
          personName: personInfo?.name ?? null,
          personPhone: personInfo?.phone ?? null,
          serviceName: primaryServiceName,
        });
      });
  }

  async hasOverlap(params: CheckOverlapParams): Promise<boolean> {
    if (!params.practitionerMembershipId) {
      return false;
    }
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
    const { organizationId, patientId, personId } = params;
    if (patientId) {
      const patient = await this.prisma.orm.dentistry.Patient.first({
        id: patientId,
        organizationId,
        deletedAt: null,
      });
      if (!patient) return false;
    } else if (personId) {
      const person = await this.prisma.orm.dentistry.Person.first({
        id: personId,
        organizationId,
        deletedAt: null,
      });
      if (!person) return false;
    } else {
      return false;
    }
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
