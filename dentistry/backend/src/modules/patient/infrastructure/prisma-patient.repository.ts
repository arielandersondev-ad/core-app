import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { startOfCivilDateIn } from '../../../common/validation/civil-date.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import type { Patient } from '../domain/entities/patient.entity.js';
import {
  PatientRepository,
  type PatientCreateData,
  type FindPatientsFilters,
} from '../domain/repositories/patient.repository.js';
import { toPatientEntity } from './patient.mapper.js';

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(patient: PatientCreateData): Promise<Patient> {
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
      maritalStatus: patient.maritalStatus,
      occupation: patient.occupation,
      origin: patient.origin,
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

  async findByFilters( filters: FindPatientsFilters, ): Promise<PaginatedResult<Patient>> {
    if (!filters.organizationId?.trim()) {
      throw new Error('organizationId es obligatorio.');
    }

    let query = this.prisma.orm.dentistry.Patient.where({
      organizationId: filters.organizationId,
      deletedAt: null,
    });

    if (filters.status !== undefined) {
      query = query.where({ status: filters.status });
    }

    if (filters.createdFrom || filters.createdTo) {
      const timeZone = await this.organizationTimeZone(filters.organizationId);
      if (filters.createdFrom) {
        const from = startOfCivilDateIn(filters.createdFrom, timeZone);
        query = query.where((patient) => patient.createdAt.gte(from));
      }
      if (filters.createdTo) {
        const nextDay = new Date(filters.createdTo.getTime() + 86_400_000);
        const to = startOfCivilDateIn(nextDay, timeZone);
        query = query.where((patient) => patient.createdAt.lt(to));
      }
    }

    const search = filters.search?.trim();
    if (search) {
      // Escape SQL pattern characters to keep the search a literal substring.
      const pattern = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
      query = query.where((patient) =>
        or(
          patient.firstName.ilike(pattern),
          patient.lastName.ilike(pattern),
          patient.phone.ilike(pattern),
          patient.email.ilike(pattern),
          patient.documentNumber.ilike(pattern),
        ),
      );
    }

    const limit = Math.max(1, filters.limit ?? filters.pageSize ?? DEFAULT_PAGE_SIZE);
    let page = Math.max(1, filters.page ?? DEFAULT_PAGE);
    let skip: number;

    if (filters.offset !== undefined && filters.offset >= 0) {
      skip = filters.offset;
      page = Math.floor(skip / limit) + 1;
    } else {
      skip = (page - 1) * limit;
    }

    const { totalItems } = await query.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));

    const rows = await query
      .orderBy([
        (patient) => patient.updatedAt.desc(),
        (patient) => patient.createdAt.desc(),
        (patient) => patient.lastName.asc(),
        (patient) => patient.firstName.asc(),
        (patient) => patient.id.asc(),
      ])
      .skip(skip)
      .take(limit)
      .all();

    return createPaginatedResult(
      rows.map(toPatientEntity),
      { page, limit, pageSize: limit, offset: skip },
      totalItems,
    );
  }

  private async organizationTimeZone(organizationId: string): Promise<string> {
    const organization = await this.prisma.orm.core.Organization.first({
      id: organizationId,
    });
    return organization?.timezone || 'UTC';
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
        maritalStatus: patient.maritalStatus,
        occupation: patient.occupation,
        origin: patient.origin,
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

  async softDelete(
    id: string,
    organizationId: string,
    deletedByMembershipId: string,
  ): Promise<Patient> {
    const row = await this.prisma.orm.dentistry.Patient.where({
      id,
      organizationId,
      deletedAt: null,
    }).update({
      deletedAt: new Date(),
      updatedByMembershipId: deletedByMembershipId,
    });

    if (!row) throw new NotFoundException('Paciente no encontrado');
    return toPatientEntity(row);
  }
}

function rethrowPatientConflict(error: unknown): never {
  if (hasPostgresCode(error, '23505')) throw new ConflictException('Ya existe un paciente con ese documento en la organización.',)
  throw error;
}
