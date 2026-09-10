import type { Request } from 'express';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedPrincipal;
};
