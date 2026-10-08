'use client'

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RoleQueryKeys } from "../api/endpoints"
import { roleService } from "../services/role.service"

export function useRoles(organizationId: string) {
	return useQuery({
		queryKey: RoleQueryKeys.byOrganization(organizationId),
		queryFn: () => roleService.listByOrganization(organizationId),
		enabled: Boolean(organizationId)
	})
}
export function useCreateRole() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: roleService.createRole,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: RoleQueryKeys.all
			})
		}
	})
}
