import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import { CreateRole, Role } from '../domain/entities/role.entity.js';
import { RoleRepository } from '../domain/repositories/role.repository.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';

@Injectable()
export class PrismaRoleRepository extends RoleRepository {
  constructor(private prisma: PrismaService) {
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
      .map((row) => ({
        id: row.id,
        organizationId: row.organizationId,
        name: row.name,
        code: row.code,
        description: row.description,
        deleted: row.deleted,
        deletedAt: row.deletedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));
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
}
