import type { TransactionContext } from './prisma-tx.js';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AuditLogEntry = {
  organizationId?: string;
  branchId?: string;
  userId?: string;
  actorMembershipId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: { [key: string]: JsonValue };
};

export async function writeAuditLog(
  tx: TransactionContext,
  entry: AuditLogEntry,
): Promise<void> {
  await tx.orm.core.AuditLog.create({
    organizationId: entry.organizationId,
    branchId: entry.branchId,
    userId: entry.userId,
    actorMembershipId: entry.actorMembershipId,
    action: entry.action,
    resource: entry.resource,
    resourceId: entry.resourceId,
    metadata: entry.metadata,
  });
}
