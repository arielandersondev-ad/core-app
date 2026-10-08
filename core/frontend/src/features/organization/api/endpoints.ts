export const ORGANIZATION_ENDPOINTS = {
  collection: '/organizations',
  createSetup: '/organizations/setup',
  branches: (organizationId: string) => `/organizations/${organizationId}/branches`,
} as const;

export const organizationQueryKeys = {
  all: ['organizations'] as const,

  list: () => [organizationQueryKeys.all, 'list'] as const,

  branches: (organizationId: string) => [
    ...organizationQueryKeys.all,
    'branches',
    organizationId,
  ] as const,
};
