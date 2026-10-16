import { Injectable } from '@nestjs/common';
import type { AssignmentStatus } from '../../domain/entities/plan-assignment.entity.js';
import { PlanRepository } from '../../domain/repositories/plan.repository.js';

@Injectable()
export class ListPlanAssignmentsUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(organizationId?: string) { return this.plans.listAssignments(organizationId); }
}

@Injectable()
export class AssignPlanUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(input: {
    organizationId: string;
    planId: string;
    vertical: string;
    status?: 'ACTIVE' | 'TRIALING';
    startsAt?: string;
  }) {
    return this.plans.assign({
      ...input,
      status: input.status ?? 'ACTIVE',
      startsAt: input.startsAt ? new Date(input.startsAt) : new Date(),
    });
  }
}

@Injectable()
export class ChangePlanAssignmentStatusUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(input: {
    organizationId: string;
    vertical: string;
    status: Extract<AssignmentStatus, 'ACTIVE' | 'SUSPENDED' | 'CANCELED'>;
    reason?: string;
  }) {
    return this.plans.changeAssignmentStatus(input);
  }
}
