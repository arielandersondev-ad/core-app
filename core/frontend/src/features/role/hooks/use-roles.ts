'use client'

import { useQuery } from "@tanstack/react-query"
import { RoleQueryKeys } from "../api/endpoints"
import { roleService } from "../services/role.service"

export function useRoles(organizationId: string) {
	return useQuery({
		queryKey: RoleQueryKeys.byOrganization(organizationId),
		queryFn: () => roleService.listByOrganization(organizationId),
		enabled: Boolean(organizationId)
	})
}