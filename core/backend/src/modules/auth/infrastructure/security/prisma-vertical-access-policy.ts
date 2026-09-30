import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import { toUuid36 } from '../../../../common/infrastructure/prisma-uuid.js';
import { VerticalAccessPolicy } from '../../application/ports/vertical-access-policy.js';

@Injectable()
export class PrismaVerticalAccessPolicy extends VerticalAccessPolicy {
  constructor(private readonly prisma: PrismaService) { super(); }

  async canAccessDentistry(organizationId: string, now: Date): Promise<boolean> {
    const assignment = await this.prisma.orm.core.OrganizationPlan.where({
      organizationId: toUuid36(organizationId),
      vertical: 'DENTISTRY',
    }).first();
    if (
      !assignment ||
      !['ACTIVE', 'TRIALING'].includes(assignment.status) ||
      assignment.startsAt > now ||
      assignment.endsAt <= now
    ) return false;

    const plan = await this.prisma.orm.core.Plan.first({ id: assignment.planId });
    return Boolean(plan && plan.vertical === 'DENTISTRY' && plan.active && !plan.deleted);
  }
}
