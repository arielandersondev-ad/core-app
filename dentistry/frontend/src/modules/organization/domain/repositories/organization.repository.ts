import { CreateOrganization, Organization } from "../entities/organization.entity.js";
import { CreateBranch, Branch } from "../entities/branch.entity.js";

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

  abstract findById(id: string): Promise<Organization | null>;
}
