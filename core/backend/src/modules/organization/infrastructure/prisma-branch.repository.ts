import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { Branch } from "../domain/entities/branch.entity.js";
import { BranchRepository } from "../domain/repositories/branch.repository.js";
import { toBranchEntity } from "./branch.mapper.js";
import { toUuid36 } from "../../../common/infrastructure/prisma-uuid.js";

@Injectable()
export class PrismaBranchRepository extends BranchRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async listByOrganization(organizationId: string): Promise<Branch[]> {
    const rows = await this.prisma.orm.core.Branch
      .where({ organizationId: toUuid36(organizationId) })
      .all();

    return rows.filter((row) => !row.deleted).map(toBranchEntity);
  }
}
