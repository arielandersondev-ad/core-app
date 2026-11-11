import { Injectable } from '@nestjs/common';
import { hasPostgresCode } from '../../../common/infrastructure/postgres-error.js';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { ClinicalErrors } from '../application/clinical-encounter.errors.js';
import type {
  HealthProfileTexts,
  PatientHealthProfile,
} from '../domain/entities/patient-health-profile.entity.js';
import type { EncounterScope } from '../domain/repositories/clinical-encounter.repository.js';
import { PatientHealthProfileRepository } from '../domain/repositories/patient-health-profile.repository.js';
import { toHealthProfileEntity } from './clinical-encounter.mapper.js';

@Injectable()
export class PrismaPatientHealthProfileRepository extends PatientHealthProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async find(scope: EncounterScope): Promise<PatientHealthProfile | null> {
    const row = await this.prisma.orm.dentistry.PatientHealthProfile.first({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
    });
    return row ? toHealthProfileEntity(row) : null;
  }

  async create(
    scope: EncounterScope,
    texts: HealthProfileTexts,
    actorMembershipId: string,
  ): Promise<PatientHealthProfile> {
    const row = await this.prisma.orm.dentistry.PatientHealthProfile.create({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      ...texts,
      createdByMembershipId: actorMembershipId,
    }).catch((error: unknown) => {
      if (hasPostgresCode(error, '23505')) {
        throw ClinicalErrors.healthProfileStale();
      }
      throw error;
    });
    return toHealthProfileEntity(row);
  }

  async update(
    scope: EncounterScope,
    expectedRowVersion: number,
    texts: HealthProfileTexts,
    actorMembershipId: string,
  ): Promise<PatientHealthProfile | null> {
    const row = await this.prisma.orm.dentistry.PatientHealthProfile.where({
      organizationId: scope.organizationId,
      patientId: scope.patientId,
      rowVersion: expectedRowVersion,
    }).update({
      ...texts,
      updatedByMembershipId: actorMembershipId,
      rowVersion: expectedRowVersion + 1,
    });
    return row ? toHealthProfileEntity(row) : null;
  }
}
