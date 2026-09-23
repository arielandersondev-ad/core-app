import { Permission } from "../entities/permission.entity.js";

export abstract class PermissionRepository {
	abstract listPermissionByRoleId(roleId: string): Promise<Permission[]>;
}