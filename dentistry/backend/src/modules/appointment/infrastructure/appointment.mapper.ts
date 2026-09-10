import { Appointment, type AppointmentStatus } from '../domain/entities/appointment.entity.js';

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
}

export function toAppointmentEntity(row: AppointmentRow): Appointment {
  return new Appointment({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    patientId: row.patientId,
    professionalMembershipId: row.professionalMembershipId,
    serviceId: row.serviceId,
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
  });
}
