import {
  Appointment,
  type AppointmentStatus,
} from '../domain/entities/appointment.entity.js';

export interface AppointmentServiceRow {
  id: string;
  organizationId: string;
  appointmentId: string;
  serviceId: string;
  priceMinor: number | null;
  durationMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  service?: {
    name: string;
  };
}

export interface AppointmentRow {
  id: string;
  organizationId: string;
  branchId: string;
  patientId: string;
  professionalMembershipId: string;
  serviceId: string;
  treatmentId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  reason: string | null;
  notes: string | null;
  createdByMembershipId: string;
  cancelledAt: Date | null;
  cancelledByMembershipId: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  services?: AppointmentServiceRow[];
}

export function toAppointmentEntity(row: AppointmentRow): Appointment {
  const serviceItems = (row.services || []).map((s) => ({
    id: s.id,
    serviceId: s.serviceId,
    serviceName: s.service?.name,
    priceMinor: s.priceMinor,
    durationMinutes: s.durationMinutes,
    notes: s.notes,
  }));

  const serviceIds =
    serviceItems.length > 0
      ? serviceItems.map((s) => s.serviceId)
      : [row.serviceId];

  return new Appointment({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    patientId: row.patientId,
    professionalMembershipId: row.professionalMembershipId,
    serviceId: row.serviceId,
    serviceIds,
    treatmentId: row.treatmentId,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    status: row.status as AppointmentStatus,
    reason: row.reason,
    notes: row.notes,
    createdByMembershipId: row.createdByMembershipId,
    cancelledAt: row.cancelledAt,
    cancelledByMembershipId: row.cancelledByMembershipId,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    services: serviceItems,
  });
}
