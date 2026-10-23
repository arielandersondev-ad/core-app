import type { CreatePlan, Plan, UpdatePlan } from '../entities/plan.entity.js';
import type {
  AssignPlan,
  ChangeAssignmentStatus,
  OrganizationPlanAssignment,
} from '../entities/organization-plan-assignment.entity.js';

export abstract class PlanRepository {
  abstract list(): Promise<Plan[]>;
  abstract findById(planId: string): Promise<Plan | null>;
  abstract create(input: CreatePlan): Promise<Plan>;
  abstract update(planId: string, input: UpdatePlan): Promise<Plan>;
  abstract softDelete(planId: string): Promise<Plan>;
  abstract listAssignments(organizationId?: string): Promise<OrganizationPlanAssignment[]>;
  abstract assign(input: AssignPlan): Promise<OrganizationPlanAssignment>;
  abstract changeAssignmentStatus(input: ChangeAssignmentStatus): Promise<OrganizationPlanAssignment>;
}
