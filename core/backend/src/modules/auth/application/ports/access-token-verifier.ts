import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';

export abstract class AccessTokenVerifier {
  abstract verify(token: string): Promise<AuthenticatedPrincipal>;
}
