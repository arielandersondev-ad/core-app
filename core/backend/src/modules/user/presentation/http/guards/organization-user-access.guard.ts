import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../../../common/infrastructure/prisma-uuid.js';
import { CorePermissionService } from '../../../../auth/infrastructure/security/core-permission.service.js';
import type { OrganizationUserRequest } from '../types/organization-user-request.js';

@Injectable()
export class OrganizationUserAccessGuard implements CanActivate {
  constructor(
    private readonly permissions: CorePermissionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OrganizationUserRequest>();
    const principal = request.user;
    if (!principal) throw new UnauthorizedException('Usuario no autenticado');

    const requestedOrganizationId = request.params['organizationId'];
    if (requestedOrganizationId !== principal.organizationId) {
      throw new ForbiddenException('No puede consultar otra organización');
    }

    if (await this.permissions.hasPermission(principal, 'users:read:organization')) {
      request.userListScope = {
        organizationId: principal.organizationId,
        branchIds: null,
      };
      return true;
    }

    if (!(await this.permissions.hasPermission(principal, 'users:read:assigned-branches'))) {
      throw new ForbiddenException('No tiene permisos para consultar usuarios');
    }

    const links = await this.prisma.orm.core.MembershipBranch.where({
      membershipId: toUuid36(principal.membershipId),
      deleted: false,
    }).all();
    const branchIds: string[] = [];

    for (const link of links) {
      const branch = await this.prisma.orm.core.Branch.first({ id: link.branchId });
      if (
        branch &&
        !branch.deleted &&
        branch.status === 'ACTIVE' &&
        String(branch.organizationId) === principal.organizationId
      ) {
        branchIds.push(String(branch.id));
      }
    }

    request.userListScope = {
      organizationId: principal.organizationId,
      branchIds,
    };
    return true;
  }
}
