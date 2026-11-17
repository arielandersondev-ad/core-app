import { CreateOrganization, Organization } from "../entities/organization.entity.js";
import { CreateBranch, Branch } from "../entities/branch.entity.js";
import type { PaginatedResult } from "../../../../common/pagination/pagination.js";
import type { ListOrganizationsQueryDto } from "../../presentation/dto/list-organizations.query.dto.js";

export type CreateOrganizationWithBranches = {
  organization: CreateOrganization;
  branches: CreateBranch[];
  branchesAreDefault: boolean;
};

export type OrganizationWithBranches = {
  organization: Organization;
  branches: Branch[];
};

export abstract class OrganizationRepository {
  abstract createOrganization(
    data: CreateOrganizationWithBranches,
  ): Promise<OrganizationWithBranches>;

  abstract findAll(): Promise<Organization[]>;

  abstract listOrganizations(
    query?: ListOrganizationsQueryDto,
  ): Promise<PaginatedResult<Organization>>;

  abstract findById(id: string): Promise<Organization | null>;
}
