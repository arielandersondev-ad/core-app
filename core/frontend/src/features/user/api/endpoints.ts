export const USER_ENDPOINTS = {
  list: '/users',
  create: '/users/create'
} as const;

export const userQueryKeys = {
  all: ['users'] as const,
  list: () => [...userQueryKeys.all, 'list'] as const,
};
