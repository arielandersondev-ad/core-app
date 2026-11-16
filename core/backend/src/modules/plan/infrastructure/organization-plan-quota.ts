import type { TransactionContext } from '../../../common/infrastructure/prisma-tx.js';
import { readEntitlementLimit } from '../domain/entitlements.js';
import type { JsonValue } from '../domain/entities/plan.entity.js';
import { PlanLimitReachedException } from '../domain/plan-limit-reached.exception.js';

const CURRENT_STATUSES = new Set(['ACTIVE', 'TRIALING']);

/**
 * Most restrictive quota among the organization's current plan assignments.
 * Null when no current assignment defines the limit (unlimited).
 */
export async function findOrganizationLimit(
  tx: TransactionContext,
  organizationId: string,
  key: 'users' | 'branches',
  now: Date = new Date(),
): Promise<number | null> {
  const assignments = await tx.orm.core.OrganizationPlanAssignment.where({
    organizationId,
  }).all();
  let limit: number | null = null;
  for (const assignment of assignments) {
    if (
      !CURRENT_STATUSES.has(assignment.status) ||
      assignment.startsAt > now ||
      assignment.endsAt <= now
    ) {
      continue;
    }
    const value = readEntitlementLimit(
      assignment.entitlementsSnapshot as JsonValue,
      key,
    );
    if (value !== null && (limit === null || value < limit)) limit = value;
  }
  return limit;
}

/** Throws PlanLimitReachedException when adding one more item exceeds the quota. */
export async function assertOrganizationQuota(
  tx: TransactionContext,
  organizationId: string,
  key: 'users' | 'branches',
  countCurrent: () => Promise<number>,
): Promise<void> {
  const limit = await findOrganizationLimit(tx, organizationId, key);
  if (limit === null) return;
  if ((await countCurrent()) >= limit) {
    throw new PlanLimitReachedException(key, limit);
  }
}
