import {
  createParamDecorator,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

export const CurrentPrincipal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return request.user;
  },
);
