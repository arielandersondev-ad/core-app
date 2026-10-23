import { Module } from '@nestjs/common';
import { AuthSecurityModule } from '../auth/auth-security.module.js';
import { PlanRepository } from './domain/repositories/plan.repository.js';
import { PrismaPlanRepository } from './infrastructure/prisma-plan.repository.js';
import {
  CreatePlanUseCase,
  DeletePlanUseCase,
  GetPlanUseCase,
  ListPlansUseCase,
  UpdatePlanUseCase,
} from './application/use-case/plan-catalog.use-cases.js';
import {
  AssignPlanUseCase,
  ChangePlanAssignmentStatusUseCase,
  ListPlanAssignmentsUseCase,
} from './application/use-case/plan-assignment.use-cases.js';
import { PlanController } from './presentation/http/plan.controller.js';
import { OrganizationPlanAssignmentController } from './presentation/http/organization-plan-assignment.controller.js';

@Module({
  imports: [AuthSecurityModule],
  controllers: [PlanController, OrganizationPlanAssignmentController],
  providers: [
    { provide: PlanRepository, useClass: PrismaPlanRepository },
    ListPlansUseCase,
    GetPlanUseCase,
    CreatePlanUseCase,
    UpdatePlanUseCase,
    DeletePlanUseCase,
    ListPlanAssignmentsUseCase,
    AssignPlanUseCase,
    ChangePlanAssignmentStatusUseCase,
  ],
})
export class PlanModule {}
