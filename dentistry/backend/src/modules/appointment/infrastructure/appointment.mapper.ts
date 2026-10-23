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
  currency: string | null;
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
  practitionerMembershipId: string;
  treatmentId: string | null;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: string;
  reason: string | null;
  notes: string | null;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  rowVersion: number;
  canceledAt: Date | null;
  canceledByMembershipId: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  services?: AppointmentServiceRow[];
}

export function toAppointmentEntity(row: AppointmentRow): Appointment {
  const serviceItems = [...(row.services ?? [])]
    .sort(
      (a, b) =>
        a.createdAt.getTime() - b.createdAt.getTime() ||
        a.id.localeCompare(b.id),
    )
    .map((s) => ({
      id: s.id,
      serviceId: s.serviceId,
      serviceName: s.service?.name,
      priceMinor: s.priceMinor,
      currency: s.currency,
      durationMinutes: s.durationMinutes,
      notes: s.notes,
    }));

  const serviceIds = serviceItems.map((s) => s.serviceId);

  return new Appointment({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    patientId: row.patientId,
    practitionerMembershipId: row.practitionerMembershipId,
    serviceIds,
    treatmentId: row.treatmentId,
    scheduledStartAt: row.scheduledStartAt,
    scheduledEndAt: row.scheduledEndAt,
    status: row.status as AppointmentStatus,
    reason: row.reason,
    notes: row.notes,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    rowVersion: row.rowVersion,
    canceledAt: row.canceledAt,
    canceledByMembershipId: row.canceledByMembershipId,
    cancellationReason: row.cancellationReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    services: serviceItems,
  });
}
