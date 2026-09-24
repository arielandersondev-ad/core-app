import type { TransactionContext } from './prisma-tx.js';
import { toUuid36 } from './prisma-uuid.js';

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
    organizationId: toUuid36(entry.organizationId),
    branchId: toUuid36(entry.branchId),
    userId: toUuid36(entry.userId),
    action: entry.action,
    resource: entry.resource,
    resourceId: toUuid36(entry.resourceId),
    metadata: entry.metadata,
  });
}
