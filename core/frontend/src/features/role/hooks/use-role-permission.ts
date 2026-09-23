import { useQuery } from "@tanstack/react-query";
import { RoleQueryKeys } from "../api/endpoints";
import { roleService } from "../services/role.service";

export function useRolePermissions(roleId: string) {
	return useQuery({
		queryKey: RoleQueryKeys.permissionByRoleId(roleId),
		queryFn: () => roleService.listPermissionsByRoleId(roleId),
		enabled: Boolean(roleId)
	})
}