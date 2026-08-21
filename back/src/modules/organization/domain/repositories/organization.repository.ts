import { CreateOrganization, Organization } from "../entities/organization.entity.js";

export abstract class OrganizationRepository {
    abstract createOrganization(data: CreateOrganization): Promise<Organization>;
}