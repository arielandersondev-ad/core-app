import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import { isPostgresUniqueViolation } from '../../../common/infrastructure/postgres-error.js';
import type { CreateRole, Role } from '../domain/entities/role.entity.js';
import { RoleCodeAlreadyExistsError } from '../domain/errors/role-code-already-exists.error.js';
import { toRoleEntity } from './role.mapper.js';

const ROLE_CODE_UNIQUE_INDEXES = [
  'role_org_code_uidx_6af438fb',
  'role_global_code_uidx_bbc24990',
] as const;

@Injectable()
export class PrismaRoleWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRole): Promise<Role> {
    try {
      const row = await this.prisma.orm.core.Role.create({
        ...data,
        organizationId: toUuid36(data.organizationId),
      });
      return toRoleEntity(row);
    } catch (error) {
      this.rethrowKnownError(error, data.code);
    }
  }

  async createInTransaction(
    tx: TransactionContext,
    data: CreateRole,
  ): Promise<Role> {
    try {
      const row = await tx.orm.core.Role.create({
        ...data,
        organizationId: toUuid36(data.organizationId),
      });
      return toRoleEntity(row);
    } catch (error) {
      this.rethrowKnownError(error, data.code);
    }
  }

  private rethrowKnownError(error: unknown, code: string): never {
    if (isPostgresUniqueViolation(error, ROLE_CODE_UNIQUE_INDEXES)) {
      throw new RoleCodeAlreadyExistsError(code);
    }
    throw error;
  }
}
