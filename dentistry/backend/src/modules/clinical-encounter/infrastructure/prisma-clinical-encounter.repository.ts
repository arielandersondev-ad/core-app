import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { ClinicalEncounter } from '../domain/entities/clinical-encounter.entity.js';
import {
  ClinicalEncounterRepository,
  FindClinicalEncountersFilters,
} from '../domain/repositories/clinical-encounter.repository.js';
import { ClinicalEncounterRow, toClinicalEncounterEntity } from './clinical-encounter.mapper.js';

@Injectable()
export class PrismaClinicalEncounterRepository extends ClinicalEncounterRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async create(encounter: ClinicalEncounter): Promise<ClinicalEncounter> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.create({
      organizationId: toUuid36(encounter.organizationId),
      branchId: toUuid36(encounter.branchId),
      patientId: toUuid36(encounter.patientId),
      appointmentId: encounter.appointmentId ? toUuid36(encounter.appointmentId) : null,
      treatmentId: encounter.treatmentId ? toUuid36(encounter.treatmentId) : null,
      professionalMembershipId: toUuid36(encounter.professionalMembershipId),
      startedAt: encounter.startedAt,
      chiefComplaint: encounter.chiefComplaint,
      diagnosis: encounter.diagnosis,
      procedurePerformed: encounter.procedurePerformed,
      evolution: encounter.evolution,
      recommendations: encounter.recommendations,
      notes: encounter.notes,
      createdByMembershipId: toUuid36(encounter.createdByMembershipId),
    });

    return toClinicalEncounterEntity(row as unknown as ClinicalEncounterRow);
  }

  async findById(id: string): Promise<ClinicalEncounter | null> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.first({
      id: toUuid36(id),
    });

    if (!row) {
      return null;
    }

    return toClinicalEncounterEntity(row as unknown as ClinicalEncounterRow);
  }

  async findByFilters(filters: FindClinicalEncountersFilters): Promise<ClinicalEncounter[]> {
    const rows = (await this.prisma.orm.dentistry.ClinicalEncounter.where({
      organizationId: toUuid36(filters.organizationId),
    }).all()) as unknown as ClinicalEncounterRow[];

    return rows
      .filter((row) => {
        if (filters.branchId && row.branchId !== filters.branchId) return false;
        if (filters.patientId && row.patientId !== filters.patientId) return false;
        if (filters.appointmentId && row.appointmentId !== filters.appointmentId) return false;
        if (filters.treatmentId && row.treatmentId !== filters.treatmentId) return false;
        if (
          filters.professionalMembershipId &&
          row.professionalMembershipId !== filters.professionalMembershipId
        ) {
          return false;
        }
        if (filters.status) {
          const derived = row.endedAt === null ? 'IN_PROGRESS' : 'COMPLETED';
          if (derived !== filters.status) return false;
        }
        if (filters.startDate) {
          if (new Date(row.startedAt) < filters.startDate) return false;
        }
        if (filters.endDate) {
          if (new Date(row.startedAt) > filters.endDate) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .map(toClinicalEncounterEntity);
  }

  async findByAppointmentId(appointmentId: string): Promise<ClinicalEncounter | null> {
    const row = await this.prisma.orm.dentistry.ClinicalEncounter.first({
      appointmentId: toUuid36(appointmentId),
    });

    if (!row) {
      return null;
    }

    return toClinicalEncounterEntity(row as unknown as ClinicalEncounterRow);
  }

  async update(encounter: ClinicalEncounter): Promise<ClinicalEncounter> {
    await this.prisma.orm.dentistry.ClinicalEncounter.where({
      id: toUuid36(encounter.id),
    }).update({
      endedAt: encounter.endedAt,
      chiefComplaint: encounter.chiefComplaint,
      diagnosis: encounter.diagnosis,
      procedurePerformed: encounter.procedurePerformed,
      evolution: encounter.evolution,
      recommendations: encounter.recommendations,
      notes: encounter.notes,
      updatedByMembershipId: encounter.updatedByMembershipId
        ? toUuid36(encounter.updatedByMembershipId)
        : null,
      updatedAt: new Date(),
    });

    const updated = await this.findById(encounter.id);
    return updated!;
  }
}