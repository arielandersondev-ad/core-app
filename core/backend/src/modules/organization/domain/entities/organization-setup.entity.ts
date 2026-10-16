import type { Branch, CreateBranch } from './branch.entity.js';
import type {
  CreateOrganization,
  Organization,
} from './organization.entity.js';
import type {
  CreateRole,
  Role,
} from '../../../role/domain/entities/role.entity.js';

export type CreateOrganizationSetup = {
  organization: CreateOrganization;
  roles: Omit<CreateRole, 'organizationId'>[];
  branches: Omit<CreateBranch, 'organizationId'>[];
};

export type OrganizationSetup = {
  organization: Organization;
  roles: Role[];
  branches: Branch[];
};
