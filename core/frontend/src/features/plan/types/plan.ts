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
  configuration: Record<string, unknown>;
  priceMinor: number | null;
  currency: string | null;
  active: boolean;
  deleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type PlanAssignment = Readonly<{
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

export type CreatePlanPayload = {
  code: string;
  name: string;
  description?: string;
  type: PlanType;
  vertical: PlanVertical;
  durationDays: number;
  configuration: Record<string, never>;
  priceMinor?: number;
  currency?: string;
};

export type UpdatePlanPayload = Partial<Omit<CreatePlanPayload, 'code' | 'vertical' | 'configuration'>> & {
  active?: boolean;
};

export type AssignPlanPayload = {planId: string; status: 'ACTIVE' | 'TRIALING'; startsAt: string};
export type UpdateAssignmentStatusPayload = {status: 'ACTIVE' | 'SUSPENDED' | 'CANCELED'; reason?: string};
