import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { toUuid36 } from '../../../common/infrastructure/prisma-uuid.js';
import type { Branch, CreateBranch } from '../domain/entities/branch.entity.js';
import { toBranchEntity } from './branch.mapper.js';

@Injectable()
export class PrismaBranchWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBranch): Promise<Branch> {
    const row = await this.prisma.orm.core.Branch.create({
      ...data,
      organizationId: toUuid36(data.organizationId),
    });
    return toBranchEntity(row);
  }

  async createInTransaction(
    tx: TransactionContext,
    data: CreateBranch,
  ): Promise<Branch> {
    const row = await tx.orm.core.Branch.create({
      ...data,
      organizationId: toUuid36(data.organizationId),
    });
    return toBranchEntity(row);
  }
}
