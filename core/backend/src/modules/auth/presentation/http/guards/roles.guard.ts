import { CanActivate,  ExecutionContext,  ForbiddenException,  Injectable,  UnauthorizedException,} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/require-roles.decorator.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { PrismaService } from '../../../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../../../common/infrastructure/prisma-uuid.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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

    const principal = request.user;
    const membership = await this.prisma.orm.core.Membership.first({
      id: toUuid36(principal.membershipId),
    });
    if (!membership || membership.deleted || membership.status !== 'ACTIVE' ||
      String(membership.userId) !== principal.sub ||
      String(membership.organizationId) !== principal.organizationId) {
      throw new ForbiddenException('Membresía inválida');
    }
    const assigned = await this.prisma.orm.core.MembershipRole.where({
      membershipId: membership.id,
      deleted: false,
    }).all();
    for (const link of assigned) {
      const role = await this.prisma.orm.core.Role.first({ id: link.roleId });
      if (role && !role.deleted &&
        (role.organizationId === null || String(role.organizationId) === principal.organizationId) &&
        requiredRoles.includes(role.code.trim().toUpperCase())) {
        return true;
      }
    }

    throw new ForbiddenException('No tiene permisos para realizar esta acción');
  }
}
