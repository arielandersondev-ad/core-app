import type { Patient } from '../entities/patient.entity.js';
import type {
  PaginatedResult,
  PaginationInput,
} from '../../../../common/pagination/pagination.js';

export type PatientCreateData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>;

export type FindPatientsFilters = {
  organizationId: string;
  search?: string;
  status?: Patient['status'];
} & Partial<PaginationInput>;

export abstract class PatientRepository {
  abstract create(patient: PatientCreateData): Promise<Patient>;
  abstract findById(id: string, organizationId: string,): Promise<Patient | null>;
  abstract findByFilters(
    filters: FindPatientsFilters,
  ): Promise<PaginatedResult<Patient>>;
  abstract update(patient: Patient): Promise<Patient>;
  abstract softDelete(
    id: string,
    organizationId: string,
    deletedByMembershipId: string,
  ): Promise<Patient>;
}
