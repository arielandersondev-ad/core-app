import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import { PrismaRoleWriter } from '../../role/infrastructure/prisma-role.writer.js';
import type { Role } from '../../role/domain/entities/role.entity.js';
import type { Branch } from '../domain/entities/branch.entity.js';
import type {
  CreateOrganizationSetup,
  OrganizationSetup,
} from '../domain/entities/organization-setup.entity.js';
import { OrganizationProvisioningRepository } from '../domain/repositories/organization-provisioning.repository.js';
import { PrismaBranchWriter } from './prisma-branch.writer.js';
import { PrismaOrganizationWriter } from './prisma-organization.writer.js';

@Injectable()
export class PrismaOrganizationProvisioningRepository extends OrganizationProvisioningRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationWriter: PrismaOrganizationWriter,
    private readonly roleWriter: PrismaRoleWriter,
    private readonly branchWriter: PrismaBranchWriter,
  ) {
    super();
  }

  create(data: CreateOrganizationSetup): Promise<OrganizationSetup> {
    return this.prisma.transaction(async (tx) => {
      const organization = await this.organizationWriter.createInTransaction(
        tx,
        data.organization,
      );

      const roles: Role[] = [];
      for (const role of data.roles) {
        roles.push(
          await this.roleWriter.createInTransaction(tx, {
            ...role,
            organizationId: organization.id,
          }),
        );
      }

      const branches: Branch[] = [];
      for (const branch of data.branches) {
        branches.push(
          await this.branchWriter.createInTransaction(tx, {
            ...branch,
            organizationId: organization.id,
          }),
        );
      }

      await writeAuditLog(tx, {
        organizationId: organization.id,
        action: 'ORGANIZATION_SETUP_CREATED',
        resource: 'Organization',
        resourceId: organization.id,
        metadata: {
          rolesCreated: roles.length,
          branchesCreated: branches.length,
        },
      });

      return { organization, roles, branches };
    });
  }
}
