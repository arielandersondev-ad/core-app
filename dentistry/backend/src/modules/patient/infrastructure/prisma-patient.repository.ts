import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { Patient } from '../domain/entities/patient.entity.js';
import {
  PatientRepository,
  FindPatientsFilters,
} from '../domain/repositories/patient.repository.js';
import { toPatientEntity } from './patient.mapper.js';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(patient: Patient): Promise<Patient> {
    const row = await this.prisma.orm.dentistry.Patient.create({
      organizationId: patient.organizationId,
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
      createdByMembershipId: patient.createdByMembershipId,
      updatedByMembershipId: patient.updatedByMembershipId
        ? patient.updatedByMembershipId
        : null,
      deletedAt: patient.deletedAt,
    }).catch(rethrowPatientConflict);

    return toPatientEntity(row);
  }

  async findById(id: string, organizationId: string): Promise<Patient | null> {
    const row = await this.prisma.orm.dentistry.Patient.first({
      id: id,
      organizationId: organizationId,
    });

    if (!row || row.deletedAt) {
      return null;
    }

    return toPatientEntity(row);
  }

  async findByFilters(filters: FindPatientsFilters): Promise<Patient[]> {
    const rows = await this.prisma.orm.dentistry.Patient.where({
      organizationId: filters.organizationId,
      deletedAt: null,
    }).all();

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
    const row = await this.prisma.orm.dentistry.Patient.where({
      id: patient.id,
      organizationId: patient.organizationId,
    })
      .update({
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
          ? patient.updatedByMembershipId
          : null,
        deletedAt: patient.deletedAt,
      })
      .catch(rethrowPatientConflict);

    if (!row) throw new NotFoundException('Paciente no encontrado');
    return toPatientEntity(row);
  }
}

function rethrowPatientConflict(error: unknown): never {
  if (hasPostgresCode(error, '23505')) {
    throw new ConflictException(
      'Ya existe un paciente con ese documento en la organización.',
    );
  }
  throw error;
}
