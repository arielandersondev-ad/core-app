export const ROLE_ENDPOINTS = {
  collection: '/roles',
  create: '/roles',
  permissionsByRoleId: (roleId: string) => `/roles/${roleId}/permissions`,
} as const;


// tanstack query keys
export const RoleQueryKeys = {
  all: ['roles'] as const,

  list: () =>
    [...RoleQueryKeys.all, 'list'] as const,

  detail: (roleId: string) =>
    [...RoleQueryKeys.all, 'detail', roleId] as const,

  byOrganization: (organizationId: string) =>
    [...RoleQueryKeys.all, 'organization', organizationId] as const,

  permissionByRoleId: (roleId: string) =>
    [
      ...RoleQueryKeys.all,
      'permissions',
      roleId
    ] as const
};
