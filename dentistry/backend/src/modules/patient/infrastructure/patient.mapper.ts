import type {
  Patient,
  PatientSex,
  PatientStatus,
} from '../domain/entities/patient.entity.js';

export interface PatientRow {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  birthDate: Date | null;
  sex: string | null;
  documentType: string | null;
  documentNumber: string | null;
  address: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  origin: string | null;
  notes: string | null;
  status: string;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPatientEntity(row: PatientRow): Patient {
  return {
    id: row.id,
    organizationId: row.organizationId,
    firstName: row.firstName.trim(),
    lastName: row.lastName.trim(),
    phone: row.phone?.trim() ?? null,
    email: row.email?.trim() ?? null,
    birthDate: row.birthDate,
    sex: row.sex as PatientSex | null,
    documentType: row.documentType?.trim() || null,
    documentNumber: row.documentNumber?.trim() || null,
    address: row.address?.trim() ?? null,
    maritalStatus: row.maritalStatus?.trim() || null,
    occupation: row.occupation?.trim() || null,
    origin: row.origin?.trim() || null,
    notes: row.notes?.trim() ?? null,
    status: row.status as PatientStatus,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
