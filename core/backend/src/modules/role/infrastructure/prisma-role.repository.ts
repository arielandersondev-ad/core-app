import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { CreateRole, Role } from '../domain/entities/role.entity.js';
import { RoleRepository } from '../domain/repositories/role.repository.js';
import { toRoleEntity } from './role.mapper.js';
import { PrismaRoleWriter } from './prisma-role.writer.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';

@Injectable()
export class PrismaRoleRepository extends RoleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly writer: PrismaRoleWriter,
  ) {
    super();
  }

  async listByOrganizationScope(organizationId: string): Promise<Role[]> {
    const rows = await this.prisma.orm.core.Role.all();

    return rows
      .filter(
        (row) =>
          !row.deleted &&
          (row.organizationId === null ||
            row.organizationId === organizationId),
      )
      .map(toRoleEntity);
  }

  async existsByCodeInScope( code: string, organizationId: string | null ): Promise<boolean> {
    const rows = await this.prisma.orm.core.Role.where({
      code,
      deleted: false,
    }).all();

    return rows.some((row) => row.organizationId === organizationId);
  }

  async create(role: CreateRole): Promise<Role> {
    try {
      const row = await this.prisma.orm.core.Role.create({
        code: role.code,
        description: role.description,
        name: role.name,
        organizationId: toUuid36(role.organizationId),
      });

      return {
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        code: row.code,
        description: row.description,
        deleted: row.deleted,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    } catch (error) {
      throw error;
    }
  }

  async replacePermissions(roleId: string, permissionIds: string[]) {
    return this.prisma.transaction(async (tx) => {
      const role = await tx.orm.core.Role.first({ id: toUuid36(roleId) });
      if (!role || role.deleted) throw new NotFoundException('Rol no encontrado');
      if (role.organizationId === null) {
        throw new ForbiddenException('No se pueden modificar permisos de un rol sin organizacion');
      }
      const organization = await tx.orm.core.Organization.first({ id: role.organizationId });
      if (!organization || organization.deleted || organization.status !== 'ACTIVE') {
        throw new ForbiddenException('La organización del rol no está activa');
      }

      for (const permissionId of permissionIds) {
        const permission = await tx.orm.core.Permission.first({ id: toUuid36(permissionId) });
        if (!permission) throw new BadRequestException(`El permiso ${permissionId} no existe`);
      }

      const existing = await tx.orm.core.RolePermission.where({ roleId: role.id }).all();
      const requested = new Set(permissionIds);
      const previous = new Set(existing.map((link) => String(link.permissionId)));
      for (const link of existing) {
        if (!requested.has(String(link.permissionId))) {
          await tx.orm.core.RolePermission.where({ id: link.id }).delete();
        }
      }
      for (const permissionId of permissionIds) {
        if (!previous.has(permissionId)) {
          await tx.orm.core.RolePermission.create({
            roleId: role.id,
            permissionId: toUuid36(permissionId),
          });
        }
      }
      return {
        roleId: String(role.id),
        organizationId: String(role.organizationId),
        permissionIds,
      };
    });
  }
}
