import type {
  CreateOrganizationSetup,
  OrganizationSetup,
} from '../entities/organization-setup.entity.js';

export abstract class OrganizationProvisioningRepository {
  abstract create(data: CreateOrganizationSetup): Promise<OrganizationSetup>;
}
