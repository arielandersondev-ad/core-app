import { TOKEN_AUDIENCES, type TokenAudience } from '../contracts/token-audience.js';

export function permissionsForAudience(
  permissions: readonly string[],
  audience: TokenAudience,
): string[] {
  const dentistry = audience === TOKEN_AUDIENCES.dentistry;
  return [...new Set(permissions.filter((code) =>
    code.startsWith('dentistry:') === dentistry,
  ))].sort();
}
