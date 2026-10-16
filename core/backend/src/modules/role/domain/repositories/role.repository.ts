import { CreateRole, Role } from '../entities/role.entity.js';

export abstract class RoleRepository {
  abstract listByOrganizationScope(organizationId: string): Promise<Role[]>;
  abstract existsByCodeInScope( code: string, organizationId: string | null ): Promise<boolean>;
  abstract create(role: CreateRole): Promise<Role>;
  abstract replacePermissions(roleId: string, permissionIds: string[]): Promise<{
    roleId: string;
    organizationId: string;
    permissionIds: string[];
  }>;
}
