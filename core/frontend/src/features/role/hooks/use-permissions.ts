import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PermissionQueryKeys, RoleQueryKeys } from '../api/endpoints';
import { roleService } from '../services/role.service';

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: RoleQueryKeys.permissionByRoleId(roleId),
    queryFn: () => roleService.listPermissionsByRoleId(roleId),
    enabled: Boolean(roleId),
  });
}

export function usePermissions(enabled: boolean) {
  return useQuery({
    queryKey: PermissionQueryKeys.list(),
    queryFn: roleService.listPermissions,
    enabled,
  });
}

export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleService.createPermission,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: PermissionQueryKeys.all,
      });
    },
  });
}
type ReplaceRolePermissionsVariables = {
  roleId: string;
  permissionIds: string[];
};

export function useReplaceRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: ReplaceRolePermissionsVariables) =>
      roleService.replaceRolePermissions(roleId, { permissionIds }),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: RoleQueryKeys.permissionByRoleId(variables.roleId),
      });
    },
  });
}
