import { CanActivate,  ExecutionContext,  ForbiddenException,  Injectable,  UnauthorizedException,} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-roles.decorator.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<readonly string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    if (requiredRoles.some((role) => request.user?.roleCodes.includes(role))) {
      return true;
    }

    throw new ForbiddenException('No tiene permisos para realizar esta acción');
  }
}
