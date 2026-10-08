import { Patient } from '../entities/patient.entity.js';

export interface FindPatientsFilters {
  organizationId: string;
  search?: string;
  status?: string;
}

export abstract class PatientRepository {
  abstract create(patient: Patient): Promise<Patient>;
  abstract findById(
    id: string,
    organizationId: string,
  ): Promise<Patient | null>;
  abstract findByFilters(filters: FindPatientsFilters): Promise<Patient[]>;
  abstract update(patient: Patient): Promise<Patient>;
}
