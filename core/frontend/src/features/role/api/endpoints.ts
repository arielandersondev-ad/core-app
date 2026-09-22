export const ROLE_ENDPOINTS = {
  browser: {
    list: '/roles', // Axios -> Next
  },
  backend: {
    listByOrganization: '/role/get-list-org', // Next -> Nest
  },
} as const;

export const roleQueryKeys = {
  all: ['roles'] as const,
  byOrganization: (organizationId: string) =>
    ['roles', 'organization', organizationId] as const,
};