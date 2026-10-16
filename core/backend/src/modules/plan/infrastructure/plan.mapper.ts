import type { Plan, PlanType } from '../domain/entities/plan.entity.js';

type PlanRow = {
  id: string; code: string; name: string; description: string | null;
  type: string; vertical: string; durationDays: number; configuration: unknown;
  priceMinor: number | null; currency: string | null; active: boolean;
  deleted: boolean; deletedAt: Date | null; createdAt: Date; updatedAt: Date;
};

export function toPlanEntity(row: PlanRow): Plan {
  return {
    ...row,
    type: row.type as PlanType,
    configuration: row.configuration as Plan['configuration'],
  };
}
