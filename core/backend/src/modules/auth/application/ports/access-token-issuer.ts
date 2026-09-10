import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';

export abstract class AccessTokenIssuer {
  abstract sign(principal: AuthenticatedPrincipal): Promise<string>;
}
