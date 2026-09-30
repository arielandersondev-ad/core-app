import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { DentistryPrincipal } from '../../../application/contracts/dentistry-principal.js';

export type AuthenticatedRequest = Request & { user: DentistryPrincipal };

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): DentistryPrincipal =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user,
);
