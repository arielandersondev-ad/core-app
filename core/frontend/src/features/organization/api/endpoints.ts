export const ORGANIZATION_ENDPOINTS = {
  collection: '/organizations',
  createSetup: '/organizations/setup',
} as const;

export const organizationQueryKeys = {
  all: ['organizations'] as const,

  list: () => ['organizations', 'list'] as const,
};
