import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSION } from '../decorators/require-permission.decorator.js';
import type { AuthenticatedRequest } from '../decorators/current-principal.decorator.js';

@Injectable()
export class DentistryPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(REQUIRED_PERMISSION, [
      context.getHandler(), context.getClass(),
    ]);
    if (!permission) return true;
    const principal = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!principal?.permissions.includes(permission)) {
      throw new ForbiddenException('No tiene permiso para esta operación');
    }
    return true;
  }
}
