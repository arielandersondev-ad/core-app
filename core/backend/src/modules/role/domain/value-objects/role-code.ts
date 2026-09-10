export const ROLE_CODE_PATTERN = /^[A-Z][A-Z0-9_]*$/;

export function normalizeRoleCode(value: string): string {
  return value.trim().toUpperCase();
}
