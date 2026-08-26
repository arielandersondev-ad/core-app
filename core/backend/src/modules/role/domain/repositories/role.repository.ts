import { CreateRole, Role } from "../entities/role.entity.js";

export abstract class RoleRepository {
  abstract listByOrganizationScope(organizationId: string): Promise<Role[]>;
  abstract create(role: CreateRole): Promise<Role>;
}
