export const PLAN_ENDPOINTS = {
  collection: '/plans',
  detail: (id: string) => `/plans/${id}`,
  assignments: '/plans/assignments',
  organizationAssignments: (organizationId: string) => `/organizations/${organizationId}/plans`,
  organizationVertical: (organizationId: string, vertical: string) =>
    `/organizations/${organizationId}/plans/${vertical}`,
  organizationVerticalStatus: (organizationId: string, vertical: string) =>
    `/organizations/${organizationId}/plans/${vertical}/status`,
} as const;

export const planQueryKeys = {
  all: ['plans'] as const,
  list: () => [...planQueryKeys.all, 'list'] as const,
  assignments: () => [...planQueryKeys.all, 'assignments'] as const,
};
