export const TOKEN_AUDIENCES = {
  core: 'core-api',
  dentistry: 'dentistry-api',
} as const;

export type TokenAudience = (typeof TOKEN_AUDIENCES)[keyof typeof TOKEN_AUDIENCES];
