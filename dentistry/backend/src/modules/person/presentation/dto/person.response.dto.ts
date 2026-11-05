import { Person } from '../../domain/entities/person.entity.js';

export class PersonResponseDto {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nombreCompleto: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  convertedToPatientId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;

  static fromDomain(person: Person): PersonResponseDto {
    const dto = new PersonResponseDto();
    dto.id = person.id;
    dto.organizationId = person.organizationId;
    dto.firstName = person.firstName;
    dto.lastName = person.lastName;
    dto.fullName = person.fullName;
    dto.nombreCompleto = person.fullName;
    dto.phone = person.phone;
    dto.email = person.email;
    dto.notes = person.notes;
    dto.convertedToPatientId = person.convertedToPatientId;
    dto.convertedAt = person.convertedAt?.toISOString() ?? null;
    dto.createdAt = person.createdAt.toISOString();
    dto.updatedAt = person.updatedAt.toISOString();
    return dto;
  }
}
