import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';
import type { TokenAudience } from '../contracts/token-audience.js';

export abstract class AccessTokenIssuer {
  abstract sign(
    principal: AuthenticatedPrincipal,
    audience: TokenAudience,
  ): Promise<string>;
}
