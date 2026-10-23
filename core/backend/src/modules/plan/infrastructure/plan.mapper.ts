import type { Plan, PlanType } from '../domain/entities/plan.entity.js';

type PlanRow = {
  id: string; code: string; name: string; description: string | null;
  type: string; vertical: string; durationDays: number; entitlements: unknown;
  priceMinor: number | null; currency: string | null; isActive: boolean;
  deletedAt: Date | null; createdAt: Date; updatedAt: Date;
};

export function toPlanEntity(row: PlanRow): Plan {
  return {
    ...row,
    deleted: row.deletedAt !== null,
    type: row.type as PlanType,
    entitlements: row.entitlements as Plan['entitlements'],
  };
}
