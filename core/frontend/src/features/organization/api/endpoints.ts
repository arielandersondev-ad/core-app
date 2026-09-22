export const ORGANIZATION_ENDPOINTS = {
  list: '/organizations',
} as const;

export const organizationQueryKeys = {
  list: () => ['organizations', 'list'] as const,
};
