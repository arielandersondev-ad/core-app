export type PlanType = 'PUBLIC' | 'CUSTOM';
export type PlanVertical = 'DENTISTRY';
export type AssignmentStatus = 'ACTIVE' | 'TRIALING' | 'SUSPENDED' | 'CANCELED';

export type Plan = Readonly<{
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: PlanType;
  vertical: PlanVertical;
  durationDays: number;
  entitlements: Record<string, unknown>;
  priceMinor: number | null;
  currency: string | null;
  isActive: boolean;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type OrganizationPlanAssignment = Readonly<{
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planCode: string;
  planName: string;
  vertical: PlanVertical;
  status: AssignmentStatus;
  startsAt: string;
  endsAt: string;
  renewalPreference: string;
  renewalCount: number;
  lastRenewedAt: string | null;
  suspendedAt: string | null;
  suspensionReason: string | null;
  canceledAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type PlanEntitlementLimits = {
  patients?: number | null;
  users?: number | null;
  branches?: number | null;
};

/** Claves conocidas del snapshot; el resto se conserva sin cambios. */
export type PlanEntitlements = Record<string, unknown> & {
  modules?: string[];
  limits?: PlanEntitlementLimits;
};

export type CreatePlanPayload = {
  code: string;
  name: string;
  description?: string;
  type: PlanType;
  vertical: PlanVertical;
  durationDays: number;
  entitlements: PlanEntitlements;
  priceMinor?: number;
  currency?: string;
};

export type UpdatePlanPayload = Partial<Omit<CreatePlanPayload, 'code' | 'vertical'>> & {
  isActive?: boolean;
};

export type AssignPlanPayload = {planId: string; status: 'ACTIVE' | 'TRIALING'; startsAt: string};
export type UpdateAssignmentStatusPayload = {status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED'; reason?: string};
