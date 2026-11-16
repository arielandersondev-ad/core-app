import type { PlanEntitlements } from '../contracts/plan-entitlements.js';

export abstract class PlanEntitlementsReader {
  /** Entitlements of the current Dentistry plan; null when none is current. */
  abstract read(organizationId: string, now?: Date): Promise<PlanEntitlements | null>;
}
