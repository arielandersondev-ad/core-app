import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../../common/infrastructure/prisma-uuid.js';
import type { AuthenticatedPrincipal } from '../../application/contracts/authenticated-principal.js';

@Injectable()
export class CorePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPermission( principal: AuthenticatedPrincipal, code: string ): Promise<boolean> {
    const membership = await this.prisma.orm.core.Membership.first({
      id: toUuid36(principal.membershipId),
    });

    if (
      !membership ||
      membership.deleted ||
      membership.status !== 'ACTIVE' ||
      String(membership.userId) !== principal.sub ||
      String(membership.organizationId) !== principal.organizationId
    ) {
      return false;
    }

    const user = await this.prisma.orm.core.User.first({
      id: toUuid36(principal.sub),
    });

    if (!user || user.deleted || user.status !== 'ACTIVE') {
      return false;
    }

    const permission = await this.prisma.orm.core.Permission.first({ code });
    if (!permission) return false;

    const assignedRoles = await this.prisma.orm.core.MembershipRole.where({
      membershipId: membership.id,
      deleted: false,
    }).all();

    for (const assignedRole of assignedRoles) {
      const role = await this.prisma.orm.core.Role.first({
        id: assignedRole.roleId,
      });

      if (
        !role ||
        role.deleted ||
        (role.organizationId !== null &&
          String(role.organizationId) !== principal.organizationId)
      ) {
        continue;
      }

      const assignment = await this.prisma.orm.core.RolePermission.where({
        roleId: role.id,
        permissionId: permission.id,
      }).first();

      if (assignment) return true;
    }

    return false;
  }
}