import { SetMetadata } from '@nestjs/common';

const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export const ROLES_KEY = Symbol('auth:required-roles');

export function RequireRoles(
  ...roleCodes: string[]
): MethodDecorator & ClassDecorator {
  const normalizedCodes = roleCodes.map((code) => code.trim().toUpperCase());
  if (normalizedCodes.some((code) => !ROLE_CODE_PATTERN.test(code))) {
    throw new Error('RequireRoles recibió un código de rol inválido');
  }
  return SetMetadata(ROLES_KEY, [...new Set(normalizedCodes)]);
}
