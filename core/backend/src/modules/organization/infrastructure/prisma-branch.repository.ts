import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { Branch, CreateBranch } from '../domain/entities/branch.entity.js';
import { BranchRepository } from '../domain/repositories/branch.repository.js';
import { toBranchEntity } from './branch.mapper.js';
import { PrismaBranchWriter } from './prisma-branch.writer.js';

@Injectable()
export class PrismaBranchRepository extends BranchRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly writer: PrismaBranchWriter,
  ) {
    super();
  }

  async listByOrganization(organizationId: string): Promise<Branch[]> {
    const rows = await this.prisma.orm.core.Branch.where({
      organizationId: organizationId,
    }).all();

    return rows.filter((row) => !row.deletedAt).map(toBranchEntity);
  }

  async create(branch: CreateBranch): Promise<Branch> {
    return this.writer.create(branch);
  }
}
