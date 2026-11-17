import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import type { Branch, CreateBranch } from '../domain/entities/branch.entity.js';
import { toBranchEntity } from './branch.mapper.js';
import { assertOrganizationQuota } from '../../plan/infrastructure/organization-plan-quota.js';

@Injectable()
export class PrismaBranchWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateBranch): Promise<Branch> {
    const { organizationId } = data;
    return this.prisma.transaction(async (tx) => {
      if (organizationId) {
        await assertOrganizationQuota(tx, organizationId, 'branches', async () => {
          const { totalItems } = await tx.orm.core.Branch.where({
            organizationId,
            deletedAt: null,
          }).aggregate((aggregate) => ({ totalItems: aggregate.count() }));
          return totalItems;
        });
      }
      return this.createInTransaction(tx, data);
    });
  }

  async createInTransaction(
    tx: TransactionContext,
    data: CreateBranch,
  ): Promise<Branch> {
    const row = await tx.orm.core.Branch.create({
      ...data,
      organizationId: data.organizationId,
    });
    return toBranchEntity(row);
  }
}
