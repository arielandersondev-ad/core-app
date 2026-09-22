export const USER_ENDPOINTS = {
  list: '/users',
} as const;

export const userQueryKeys = {
  all: ['users'] as const,
  list: () => ['users', 'list'] as const,
};
