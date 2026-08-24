import { Role } from "../entities/role.entity.js";

export abstract class RoleRepository {
  abstract listByOrganizationScope(organizationId: string): Promise<Role[]>;
}
