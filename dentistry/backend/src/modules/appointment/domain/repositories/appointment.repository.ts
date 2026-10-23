import { Appointment } from '../entities/appointment.entity.js';

export interface FindAppointmentsFilters {
  organizationId: string;
  authorizedBranchIds: string[];
  branchId?: string;
  patientId?: string;
  practitionerMembershipId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export interface CheckOverlapParams {
  organizationId: string;
  branchId?: string;
  practitionerMembershipId: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  excludeAppointmentId?: string;
}

export interface AppointmentReferences {
  organizationId: string;
  patientId: string;
  serviceIds: string[];
  treatmentId?: string | null;
}

export abstract class AppointmentRepository {
  abstract create(appointment: Appointment): Promise<Appointment>;
  abstract findById(
    id: string,
    organizationId: string,
  ): Promise<Appointment | null>;
  abstract findByFilters(
    filters: FindAppointmentsFilters,
  ): Promise<Appointment[]>;
  abstract hasOverlap(params: CheckOverlapParams): Promise<boolean>;
  abstract referencesBelongToOrganization(
    params: AppointmentReferences,
  ): Promise<boolean>;
  abstract update(
    appointment: Appointment,
    organizationId: string,
  ): Promise<Appointment | null>;
}
