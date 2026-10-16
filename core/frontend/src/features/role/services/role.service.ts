import { api } from "@/infrastructure/http/api";
import type { CreatePermissionPayload, CreateRole, PermissionGroup, PermissionItem, ReplaceRolePermissionsPayload, RoleListItem } from "../types/role";
import { ROLE_ENDPOINTS } from "../api/endpoints";

export const roleService = {
	async listByOrganization(organizationId: string): Promise<RoleListItem[]> {
		const {data} = await api.get<RoleListItem[]>(ROLE_ENDPOINTS.collection, {
			params: { organizationId }
		});
		return data;
	},
	async listPermissionsByRoleId(roleId: string): Promise<PermissionGroup[]> {
		const {data} = await api.get<PermissionGroup[]>(ROLE_ENDPOINTS.permissionsByRoleId(roleId));
		return data
	},
	async listPermissions(): Promise<PermissionItem[]> {
		const {data} = await api.get<PermissionItem[]>(ROLE_ENDPOINTS.permissions);
		return data
	},
	async createRole(data: CreateRole): Promise<void> {
		await api.post(ROLE_ENDPOINTS.create, data);
	},
	async createPermission(data: CreatePermissionPayload): Promise<void> {
		await api.post(ROLE_ENDPOINTS.permissions, data)
	},
	async replaceRolePermissions(roleId: string, data: ReplaceRolePermissionsPayload): Promise<void> {
		await api.put(ROLE_ENDPOINTS.updatePermissionsByRoleId(roleId), data)
	}
}
