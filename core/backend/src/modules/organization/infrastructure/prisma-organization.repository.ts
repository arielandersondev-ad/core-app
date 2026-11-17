import { Injectable } from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { writeAuditLog } from '../../../common/infrastructure/prisma-audit.writer.js';
import type { Organization } from '../domain/entities/organization.entity.js';
import {
  type CreateOrganizationWithBranches,
  OrganizationRepository,
  type OrganizationWithBranches,
} from '../domain/repositories/organization.repository.js';
import { toOrganizationEntity } from './organization.mapper.js';
import { PrismaOrganizationWriter } from './prisma-organization.writer.js';
import { PrismaBranchWriter } from './prisma-branch.writer.js';
import type { Branch } from '../domain/entities/branch.entity.js';
import {
  createPaginatedResult,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  type PaginatedResult,
} from '../../../common/pagination/pagination.js';
import type { ListOrganizationsQueryDto } from '../presentation/dto/list-organizations.query.dto.js';

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

  async listOrganizations(
    query?: ListOrganizationsQueryDto,
  ): Promise<PaginatedResult<Organization>> {
    let q = this.prisma.orm.core.Organization.where({
      deletedAt: null,
    });

    if (query?.status) {
      q = q.where({ status: query.status.toUpperCase() });
    }

    const search = query?.search?.trim();
    if (search) {
      const pattern = '%' + search.replace(/[\\%_]/g, '\\$&') + '%';
      q = q.where((org) =>
        or(
          org.name.ilike(pattern),
          org.legalName.ilike(pattern),
          org.taxId.ilike(pattern),
        ),
      );
    }

    const limit = Math.max(1, query?.limit ?? query?.pageSize ?? DEFAULT_PAGE_SIZE);
    let page = Math.max(1, query?.page ?? DEFAULT_PAGE);
    let skip: number;

    if (query?.offset !== undefined && query.offset >= 0) {
      skip = query.offset;
      page = Math.floor(skip / limit) + 1;
    } else {
      skip = (page - 1) * limit;
    }

    const { totalItems } = await q.aggregate((aggregate) => ({
      totalItems: aggregate.count(),
    }));

    const rows = await q
      .orderBy([
        (org) => org.name.asc(),
        (org) => org.id.asc(),
      ])
      .skip(skip)
      .take(limit)
      .all();

    return createPaginatedResult(
      rows.map(toOrganizationEntity),
      { page, limit, pageSize: limit, offset: skip },
      totalItems,
    );
  }

  async findAll(): Promise<Organization[]> {
    const rows = await this.prisma.orm.core.Organization.where({
      deletedAt: null,
    }).all();

    return rows.map(toOrganizationEntity);
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.orm.core.Organization.first({
      id: id,
    });

    if (!row || row.deletedAt) {
      return null;
    }

    return toOrganizationEntity(row);
  }
}
