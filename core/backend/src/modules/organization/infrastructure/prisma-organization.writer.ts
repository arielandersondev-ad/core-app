import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import type {
  CreateOrganization,
  Organization,
} from '../domain/entities/organization.entity.js';
import { toOrganizationEntity } from './organization.mapper.js';

@Injectable()
export class PrismaOrganizationWriter {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganization): Promise<Organization> {
    const row = await this.prisma.orm.core.Organization.create(data);
    return toOrganizationEntity(row);
  }

  async createInTransaction(
    tx: TransactionContext,
    data: CreateOrganization,
  ): Promise<Organization> {
    const row = await tx.orm.core.Organization.create(data);
    return toOrganizationEntity(row);
  }
}
