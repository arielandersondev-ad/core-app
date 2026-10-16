export type AssignmentStatus = 'TRIALING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELED';

export type PlanAssignment = {
  id: string;
  organizationId: string;
  organizationName: string;
  planId: string;
  planCode: string;
  planName: string;
  vertical: string;
  status: AssignmentStatus;
  startsAt: Date;
  endsAt: Date;
  renewalPreference: string;
  renewalCount: number;
  lastRenewedAt: Date | null;
  suspendedAt: Date | null;
  suspensionReason: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AssignPlan = {
  organizationId: string;
  planId: string;
  vertical: string;
  status: Extract<AssignmentStatus, 'TRIALING' | 'ACTIVE'>;
  startsAt: Date;
};

export type ChangeAssignmentStatus = {
  organizationId: string;
  vertical: string;
  status: Extract<AssignmentStatus, 'ACTIVE' | 'SUSPENDED' | 'CANCELED'>;
  reason?: string;
};
