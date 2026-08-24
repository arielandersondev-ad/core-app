import { Branch } from "../entities/branch.entity.js";

export abstract class BranchRepository {
  abstract listByOrganization(organizationId: string): Promise<Branch[]>;
}
