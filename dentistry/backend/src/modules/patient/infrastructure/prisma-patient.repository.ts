import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { Patient } from '../domain/entities/patient.entity.js';
import {
  PatientRepository,
  FindPatientsFilters,
} from '../domain/repositories/patient.repository.js';
import { PatientRow, toPatientEntity } from './patient.mapper.js';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(patient: Patient): Promise<Patient> {
    const row = (await this.prisma.orm.dentistry.Patient.create({
      organizationId: toUuid36(patient.organizationId),
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      birthDate: patient.birthDate,
      sex: patient.sex,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      address: patient.address,
      notes: patient.notes,
      status: patient.status,
      createdByMembershipId: toUuid36(patient.createdByMembershipId),
      updatedByMembershipId: patient.updatedByMembershipId
        ? toUuid36(patient.updatedByMembershipId)
        : null,
      deleted: patient.deleted,
      deletedAt: patient.deletedAt,
    })) as unknown as PatientRow;

    return toPatientEntity(row);
  }

  async findById(
    id: string,
    organizationId: string,
  ): Promise<Patient | null> {
    const row = (await this.prisma.orm.dentistry.Patient.first({
      id: toUuid36(id),
      organizationId: toUuid36(organizationId),
    })) as unknown as PatientRow | null;

    if (!row || row.deleted) {
      return null;
    }

    return toPatientEntity(row);
  }

  async findByFilters(filters: FindPatientsFilters): Promise<Patient[]> {
    const rows = (await this.prisma.orm.dentistry.Patient.where({
      organizationId: toUuid36(filters.organizationId),
      deleted: false,
    }).all()) as unknown as PatientRow[];

    let filtered = rows;

    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          (r.phone && r.phone.toLowerCase().includes(q)) ||
          (r.email && r.email.toLowerCase().includes(q)) ||
          (r.documentNumber && r.documentNumber.toLowerCase().includes(q)),
      );
    }

    return filtered
      .sort((a, b) => a.lastName.localeCompare(b.lastName))
      .map(toPatientEntity);
  }

  async update(patient: Patient): Promise<Patient> {
    const row = (await this.prisma.orm.dentistry.Patient.where({
      id: toUuid36(patient.id),
      organizationId: toUuid36(patient.organizationId),
    }).update({
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      email: patient.email,
      birthDate: patient.birthDate,
      sex: patient.sex,
      documentType: patient.documentType,
      documentNumber: patient.documentNumber,
      address: patient.address,
      notes: patient.notes,
      status: patient.status,
      updatedByMembershipId: patient.updatedByMembershipId
        ? toUuid36(patient.updatedByMembershipId)
        : null,
      deleted: patient.deleted,
      deletedAt: patient.deletedAt,
    })) as unknown as PatientRow;

    return toPatientEntity(row);
  }
}
