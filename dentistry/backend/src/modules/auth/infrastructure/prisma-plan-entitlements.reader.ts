import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/infrastructure/prisma.service.js';
import {
  parsePlanEntitlements,
  type PlanEntitlements,
} from '../application/contracts/plan-entitlements.js';
import { PlanEntitlementsReader } from '../application/ports/plan-entitlements.reader.js';

const CURRENT_STATUSES = new Set(['ACTIVE', 'TRIALING']);

/** Reads the plan snapshot from Core by organization id (no cross-schema FK). */
@Injectable()
export class PrismaPlanEntitlementsReader extends PlanEntitlementsReader {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async read(
    organizationId: string,
    now: Date = new Date(),
  ): Promise<PlanEntitlements | null> {
    const assignments = await this.prisma.orm.core.OrganizationPlanAssignment.where({
      organizationId,
      vertical: 'DENTISTRY',
    }).all();
    const current = assignments.find(
      (assignment) =>
        CURRENT_STATUSES.has(assignment.status) &&
        assignment.startsAt <= now &&
        assignment.endsAt > now,
    );
    return current ? parsePlanEntitlements(current.entitlementsSnapshot) : null;
  }
}
