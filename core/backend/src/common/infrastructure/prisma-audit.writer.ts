import type { TransactionContext } from "./prisma-tx.js";
import { toUuid36 } from "./prisma-uuid.js";

export type AuditLogEntry = {
  organizationId?: string;
  branchId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(
  tx: TransactionContext,
  entry: AuditLogEntry,
): Promise<void> {
  await tx.orm.public.AuditLog.create({
    organizationId: toUuid36(entry.organizationId),
    branchId: toUuid36(entry.branchId),
    userId: toUuid36(entry.userId),
    action: entry.action,
    resource: entry.resource,
    resourceId: toUuid36(entry.resourceId),
    //metadata: entry.metadata,
  });
}
