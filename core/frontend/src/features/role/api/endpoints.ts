export const ROLE_ENDPOINTS = {
  collection: '/roles',
  create: '/roles',
  permissions: '/roles/permissions',
  permissionsByRoleId: (roleId: string) => `/roles/${roleId}/permissions`,
  updatePermissionsByRoleId: (roleId: string) => `/roles/${roleId}/permissions`,
} as const;

export const RoleQueryKeys = {
  all: ['roles'] as const,

  list: () => [...RoleQueryKeys.all, 'list'] as const,

  detail: (roleId: string) => [...RoleQueryKeys.all, 'detail', roleId] as const,

  byOrganization: (organizationId: string) =>
    [...RoleQueryKeys.all, 'organization', organizationId] as const,

  permissionByRoleId: (roleId: string) =>
    [...RoleQueryKeys.all, 'permissions', roleId] as const,
};

export const PermissionQueryKeys = {
  all: ['permissions'] as const,
  list: () => [...PermissionQueryKeys.all, 'list'] as const,
};
