import { api } from "@/infrastructure/http/api";
import { PermissionGroup, RoleListItem } from "../types/role";
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
	}
}
