import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/infrastructure/prisma.service.js';
import { VerticalAccessPolicy } from '../../application/ports/vertical-access-policy.js';

@Injectable()
export class PrismaVerticalAccessPolicy extends VerticalAccessPolicy {
  constructor(private readonly prisma: PrismaService) { super(); }

  async canAccessDentistry(organizationId: string, now: Date): Promise<boolean> {
    const assignment = await this.prisma.orm.core.OrganizationPlanAssignment.where({
      organizationId: organizationId,
      vertical: 'DENTISTRY',
    }).first();
    if (
      !assignment ||
      !['ACTIVE', 'TRIALING'].includes(assignment.status) ||
      assignment.startsAt > now ||
      assignment.endsAt <= now
    ) return false;

    // Catalog availability governs new grants. Existing rights are snapshotted.
    const snapshot = assignment.entitlementsSnapshot;
    return Boolean(snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) &&
      'schemaVersion' in snapshot && typeof snapshot.schemaVersion === 'number');
  }
}
