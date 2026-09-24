import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { CreateRole, Role } from '../domain/entities/role.entity.js';
import { RoleRepository } from '../domain/repositories/role.repository.js';
import { toRoleEntity } from './role.mapper.js';
import { PrismaRoleWriter } from './prisma-role.writer.js';

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

  async existsByCodeInScope(
    code: string,
    organizationId: string | null,
  ): Promise<boolean> {
    const rows = await this.prisma.orm.core.Role.where({
      code,
      deleted: false,
    }).all();

    return rows.some((row) => row.organizationId === organizationId);
  }

  async create(role: CreateRole): Promise<Role> {
    return this.writer.create(role);
  }
}
