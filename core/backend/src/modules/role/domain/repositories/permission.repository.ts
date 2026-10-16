import { PermissionListItem } from "../../application/contracts/permission-group.js";
import { Permission } from "../entities/permission.entity.js";

export abstract class PermissionRepository {
	abstract listPermissionByRoleId(roleId: string): Promise<Permission[]>;
	abstract findByCode(code: string): Promise<Permission | null>;
	abstract create(data: { code: string; name: string; description: string | null }): Promise<Permission>;
	abstract listAllPermissions(): Promise<PermissionListItem[]>
}
