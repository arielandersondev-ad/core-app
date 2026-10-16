import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import type { Organization } from '../domain/entities/organization.entity.js';
import {
  type CreateOrganizationWithBranches,
  OrganizationRepository,
  type OrganizationWithBranches,
} from '../domain/repositories/organization.repository.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { toOrganizationEntity } from './organization.mapper.js';
import { PrismaOrganizationWriter } from './prisma-organization.writer.js';
import { PrismaBranchWriter } from './prisma-branch.writer.js';
import type { Branch } from '../domain/entities/branch.entity.js';

@Injectable()
export class PrismaOrganizationRepository extends OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationWriter: PrismaOrganizationWriter,
    private readonly branchWriter: PrismaBranchWriter,
  ) {
    super();
  }

  async createOrganization(
    input: CreateOrganizationWithBranches,
  ): Promise<OrganizationWithBranches> {
    return this.prisma.transaction(async (tx) => {
      const organization = await this.organizationWriter.createInTransaction(
        tx,
        input.organization,
      );

      const branches: Branch[] = [];
      for (const branch of input.branches) {
        branches.push(
          await this.branchWriter.createInTransaction(tx, {
            ...branch,
            organizationId: organization.id,
          }),
        );
      }

      await writeAuditLog(tx, {
        organizationId: organization.id,
        action: 'ORGANIZATION_CREATED',
        resource: 'Organization',
        resourceId: organization.id,
        metadata: {
          branchesCreated: branches.length,
          isDefaultBranch: input.branchesAreDefault,
        },
      });

      return { organization, branches };
    });
  }

  async findAll(): Promise<Organization[]> {
    const rows = await this.prisma.orm.core.Organization.where({
      deleted: false,
    }).all();

    return rows.map(toOrganizationEntity);
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.orm.core.Organization.first({
      id: toUuid36(id),
    });

    if (!row || row.deleted) {
      return null;
    }

    return toOrganizationEntity(row);
  }
}
