import { Branch } from "../entities/branch.entity.js";
import { CreateBranch } from "../entities/branch.entity.js";

export abstract class BranchRepository {
  abstract listByOrganization(organizationId: string): Promise<Branch[]>;
  abstract create(branch: CreateBranch): Promise<Branch>;
}
