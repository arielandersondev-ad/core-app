import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { CreateRole, Role } from "../domain/entities/role.entity.js";
import { RoleRepository } from "../domain/repositories/role.repository.js";
import { toUuid36 } from "../../../common/infrastructure/prisma-uuid.js";

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
          (row.organizationId === null || row.organizationId === organizationId),
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

  async create(role: CreateRole): Promise<any> {
    const row = await this.prisma.orm.core.Role.create({
        code: role.code,
        description: role.description,
        name: role.name,
        organizationId: toUuid36(role.organizationId)
      });
    return row
  }
}
