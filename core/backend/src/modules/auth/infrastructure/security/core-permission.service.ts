import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import type { AuthenticatedPrincipal } from '../../application/contracts/authenticated-principal.js';

@Injectable()
export class CorePermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPermission( principal: AuthenticatedPrincipal, code: string ): Promise<boolean> {
    const membership = await this.prisma.orm.core.OrganizationMembership.first({
      id: principal.membershipId,
    });

    if (
      !membership ||
      membership.deletedAt ||
      membership.status !== 'ACTIVE' ||
      String(membership.userId) !== principal.sub ||
      String(membership.organizationId) !== principal.organizationId
    ) {
      return false;
    }

    const user = await this.prisma.orm.core.User.first({
      id: principal.sub,
    });

    if (!user || user.deletedAt || user.status !== 'ACTIVE') {
      return false;
    }

    const organization = await this.prisma.orm.core.Organization.first({
      id: membership.organizationId,
    });

    if (!organization || organization.deletedAt || organization.status !== 'ACTIVE') {
      return false;
    }

    const permission = await this.prisma.orm.core.Permission.first({ code });
    if (!permission) return false;

    const assignedRoles = await this.prisma.orm.core.OrganizationMembershipRole.where({
      membershipId: membership.id,
      deletedAt: null,
    }).all();

    for (const assignedRole of assignedRoles) {
      const role = await this.prisma.orm.core.Role.first({
        id: assignedRole.roleId,
      });

      if (
        !role ||
        role.deletedAt ||
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
