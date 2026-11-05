import { Person } from '../domain/entities/person.entity.js';

export interface PersonRow {
  id: string;
  organizationId: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  convertedToPatientId?: string | null;
  convertedAt?: Date | null;
  createdByMembershipId: string;
  updatedByMembershipId?: string | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPersonEntity(row: PersonRow): Person {
  return new Person({
    id: row.id,
    organizationId: row.organizationId,
    firstName: row.firstName,
    lastName: row.lastName ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    notes: row.notes ?? null,
    convertedToPatientId: row.convertedToPatientId ?? null,
    convertedAt: row.convertedAt ?? null,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId ?? null,
    deletedAt: row.deletedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
