import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../common/infrastructure/prisma.service.js";
import { Branch, CreateBranch } from "../domain/entities/branch.entity.js";
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

  async create(branch: CreateBranch): Promise<Branch> {
    const row = await this.prisma.orm.core.Branch.create({
      organizationId: branch.organizationId
        ? toUuid36(branch.organizationId)
        : undefined,
      name: branch.name,
      code: branch.code,
      email: branch.email,
      phone: branch.phone,
      addressLine1: branch.addressLine1,
      addressLine2: branch.addressLine2,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      postalCode: branch.postalCode,
      latitude: branch.latitude,
      longitude: branch.longitude,
      timezone: branch.timezone,
    });

    return toBranchEntity(row);
  }
}
