import { api } from "@/infrastructure/http/api";
import { RoleListItem } from "../types/role";
import { ROLE_ENDPOINTS } from "../api/endpoints";

export const roleService = {
	async listByOrganization(organizationId: string): Promise<RoleListItem[]> {
		const {data} = await api.get<RoleListItem[]>(ROLE_ENDPOINTS.browser.list, {
			params: { organizationId }
		});
		return data;
	}
}