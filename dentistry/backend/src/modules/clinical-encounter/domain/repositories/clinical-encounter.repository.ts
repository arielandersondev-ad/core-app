import { ClinicalEncounter } from '../entities/clinical-encounter.entity.js';

export interface FindClinicalEncountersFilters {
  organizationId: string;
  branchId?: string;
  patientId?: string;
  professionalMembershipId?: string;
  appointmentId?: string;
  treatmentId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
}

export abstract class ClinicalEncounterRepository {
  abstract create(encounter: ClinicalEncounter): Promise<ClinicalEncounter>;
  abstract findById(id: string): Promise<ClinicalEncounter | null>;
  abstract findByFilters(filters: FindClinicalEncountersFilters): Promise<ClinicalEncounter[]>;
  abstract findByAppointmentId(appointmentId: string): Promise<ClinicalEncounter | null>;
  abstract update(encounter: ClinicalEncounter): Promise<ClinicalEncounter>;
}