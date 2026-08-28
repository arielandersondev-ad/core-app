import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { writeAuditLog } from "../../../common/infrastructure/prisma-audit.writer.js";
import { Organization } from "../domain/entities/organization.entity.js";
import { toBranchEntity, type BranchRow } from "./branch.mapper.js";
import {
  CreateOrganizationWithBranches,
  OrganizationRepository,
  OrganizationWithBranches,
} from "../domain/repositories/organization.repository.js";
import { toUuid36 } from "../../../common/infrastructure/prisma-uuid.js";

type OrganizationRow = {
  id: string;
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  country: string;
  timezone: string;
  status: string;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

function toOrganizationEntity(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    legalName: row.legalName,
    taxId: row.taxId,
    email: row.email,
    phone: row.phone,
    website: row.website,
    country: row.country,
    timezone: row.timezone,
    status: row.status,
    deleted: row.deleted,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class PrismaOrganizationRepository extends OrganizationRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async createOrganization(
    input: CreateOrganizationWithBranches,
  ): Promise<OrganizationWithBranches> {
    return this.prisma.transaction(async (tx) => {
      const organizationRow = await tx.orm.core.Organization.create({
        name: input.organization.name,
        legalName: input.organization.legalName,
        taxId: input.organization.taxId,
        email: input.organization.email,
        phone: input.organization.phone,
        website: input.organization.website,
        country: input.organization.country,
        timezone: input.organization.timezone,
      });

      const branchRows: BranchRow[] = [];
      for (const branch of input.branches) {
        const branchRow = await tx.orm.core.Branch.create({
          organizationId: organizationRow.id,
          name: branch.name,
          code: branch.code,
          email: branch.email,
          phone: branch.phone,
          addressLine1: branch.addressLine1,
          addressLine2: branch.addressLine2,
          city: branch.city,
          state: branch.state,
          country: branch.country,
          postalCode: branch.postalCode,
          latitude: branch.latitude,
          longitude: branch.longitude,
          timezone: branch.timezone,
        });
        branchRows.push(branchRow);
      }

      await writeAuditLog(tx, {
        organizationId: organizationRow.id,
        action: "ORGANIZATION_CREATED",
        resource: "Organization",
        resourceId: organizationRow.id,
        metadata: {
          branchesCreated: branchRows.length,
          isDefaultBranch: input.branchesAreDefault,
        },
      });

      return {
        organization: toOrganizationEntity(organizationRow),
        branches: branchRows.map(toBranchEntity),
      };
    });
  }

  async findAll(): Promise<Organization[]> {
    const rows = await this.prisma.orm.core.Organization
      .where({ deleted: false })
      .all();

    return rows.map(toOrganizationEntity);
  }

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.orm.core.Organization.first({ id: toUuid36(id) });

    if (!row || row.deleted) {
      return null;
    }

    return toOrganizationEntity(row);
  }
}
