import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { Person } from '../domain/entities/person.entity.js';
import {
  ListPersonsFilter,
  PersonRepository,
} from '../domain/repositories/person.repository.js';
import { toPersonEntity } from './person.mapper.js';

@Injectable()
export class PrismaPersonRepository extends PersonRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async save(person: Person): Promise<Person> {
    const existing = person.id
      ? await this.prisma.orm.dentistry.Person.first({
          id: person.id,
          organizationId: person.organizationId,
        })
      : null;

    if (existing) {
      const updated = await this.prisma.orm.dentistry.Person.where({
        id: person.id,
        organizationId: person.organizationId,
      }).update({
        firstName: person.firstName,
        lastName: person.lastName || null,
        phone: person.phone,
        email: person.email,
        notes: person.notes,
        convertedToPatientId: person.convertedToPatientId,
        convertedAt: person.convertedAt,
        updatedByMembershipId: person.updatedByMembershipId,
        deletedAt: person.deletedAt,
      });
      if (!updated) {
        throw new NotFoundException('Persona no encontrada para actualizar.');
      }
      return toPersonEntity(updated);
    }

    const created = await this.prisma.orm.dentistry.Person.create({
      organizationId: person.organizationId,
      firstName: person.firstName,
      lastName: person.lastName || null,
      phone: person.phone,
      email: person.email,
      notes: person.notes,
      convertedToPatientId: person.convertedToPatientId,
      convertedAt: person.convertedAt,
      createdByMembershipId: person.createdByMembershipId,
      updatedByMembershipId: person.updatedByMembershipId,
      deletedAt: person.deletedAt,
    });

    return toPersonEntity(created);
  }

  async findById(id: string, organizationId: string): Promise<Person | null> {
    const row = await this.prisma.orm.dentistry.Person.first({
      id,
      organizationId,
    });
    if (!row || row.deletedAt) return null;
    return toPersonEntity(row);
  }

  async list(filter: ListPersonsFilter): Promise<Person[]> {
    try {
      const rows = await this.prisma.orm.dentistry.Person.where({
        organizationId: filter.organizationId,
        deletedAt: null,
      }).all();

      return rows
        .filter((row: any) => {
          if (filter.onlyUnconverted && row.convertedToPatientId !== null) {
            return false;
          }
          if (filter.search?.trim()) {
            const s = filter.search.trim().toLowerCase();
            const fullName = `${row.firstName} ${row.lastName ?? ''}`.trim().toLowerCase();
            const phone = row.phone || '';
            if (!fullName.includes(s) && !phone.includes(s)) {
              return false;
            }
          }
          return true;
        })
        .map(toPersonEntity);
    } catch (e: any) {
      if (
        e?.cause?.code === '42P01' ||
        e?.sqlState === '42P01' ||
        e?.message?.includes('does not exist')
      ) {
        return [];
      }
      throw e;
    }
  }

  async markAsConverted(
    id: string,
    organizationId: string,
    patientId: string,
    updatedByMembershipId: string,
    convertedAt = new Date(),
  ): Promise<void> {
    const row = await this.prisma.orm.dentistry.Person.first({
      id,
      organizationId,
    });
    if (!row) {
      throw new NotFoundException('Persona no encontrada.');
    }

    await this.prisma.orm.dentistry.Person.where({
      id,
      organizationId,
    }).update({
      convertedToPatientId: patientId,
      convertedAt,
      updatedByMembershipId,
    });
  }
}
