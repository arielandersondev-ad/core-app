import {CanActivate,ExecutionContext,ForbiddenException,Injectable,UnauthorizedException,}from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CORE_ACCESS_KEY, type CoreAccess } from '../decorators/require-core-access.decorator.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { CorePermissionService } from '../../../infrastructure/security/core-permission.service.js';

@Injectable()
export class CoreAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissions: CorePermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const access = this.reflector.getAllAndOverride<CoreAccess>(
      CORE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!access) throw new ForbiddenException('Permiso de Core no definido');

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) throw new UnauthorizedException('Usuario no autenticado');

    const adminOrganizationId = process.env.CORE_ADMIN_ORGANIZATION_ID?.trim();
    if (!adminOrganizationId) {
      throw new ForbiddenException('Organización administradora no configurada');
    }
    if (user.organizationId !== adminOrganizationId) {
      throw new ForbiddenException('No pertenece a la organización administradora');
    }

    if (!(await this.permissions.hasPermission(user, access))) {
      throw new ForbiddenException('No tiene permisos para realizar esta acción');
    }

    return true;
  }
}