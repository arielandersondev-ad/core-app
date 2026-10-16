import { Patient } from '../../domain/entities/patient.entity.js';

export class PatientResponseDto {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  sex: string | null;
  documentType: string | null;
  documentNumber: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  static fromEntity(patient: Patient): PatientResponseDto {
    const dto = new PatientResponseDto();
    dto.id = patient.id;
    dto.organizationId = patient.organizationId;
    dto.firstName = patient.firstName;
    dto.lastName = patient.lastName;
    dto.fullName = patient.fullName;
    dto.phone = patient.phone;
    dto.email = patient.email;
    dto.birthDate = patient.birthDate ? patient.birthDate.toISOString() : null;
    dto.sex = patient.sex;
    dto.documentType = patient.documentType;
    dto.documentNumber = patient.documentNumber;
    dto.address = patient.address;
    dto.notes = patient.notes;
    dto.status = patient.status;
    dto.createdAt = patient.createdAt.toISOString();
    dto.updatedAt = patient.updatedAt.toISOString();
    return dto;
  }
}
