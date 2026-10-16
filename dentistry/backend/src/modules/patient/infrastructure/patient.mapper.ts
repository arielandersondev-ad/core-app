import {
  Patient,
  type PatientStatus,
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
  notes: string | null;
  status: string;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPatientEntity(row: PatientRow): Patient {
  return new Patient({
    id: row.id,
    organizationId: row.organizationId,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    birthDate: row.birthDate,
    sex: row.sex,
    documentType: row.documentType,
    documentNumber: row.documentNumber,
    address: row.address,
    notes: row.notes,
    status: row.status as PatientStatus,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
