import { Person } from '../entities/person.entity.js';

export interface ListPersonsFilter {
  organizationId: string;
  search?: string;
  onlyUnconverted?: boolean;
}

export abstract class PersonRepository {
  abstract save(person: Person): Promise<Person>;
  abstract findById(id: string, organizationId: string): Promise<Person | null>;
  abstract list(filter: ListPersonsFilter): Promise<Person[]>;
  abstract markAsConverted(
    id: string,
    organizationId: string,
    patientId: string,
    updatedByMembershipId: string,
    convertedAt?: Date,
  ): Promise<void>;
}
