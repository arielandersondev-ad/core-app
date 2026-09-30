import { Injectable, NotFoundException } from '@nestjs/common';
import { PlanRepository } from '../../domain/repositories/plan.repository.js';
import type { CreatePlan, UpdatePlan } from '../../domain/entities/plan.entity.js';

@Injectable()
export class ListPlansUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute() { return this.plans.list(); }
}

@Injectable()
export class GetPlanUseCase {
  constructor(private readonly plans: PlanRepository) {}
  async execute(planId: string) {
    const plan = await this.plans.findById(planId);
    if (!plan) throw new NotFoundException('Plan no encontrado');
    return plan;
  }
}

@Injectable()
export class CreatePlanUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(input: CreatePlan) { return this.plans.create(input); }
}

@Injectable()
export class UpdatePlanUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(planId: string, input: UpdatePlan) { return this.plans.update(planId, input); }
}

@Injectable()
export class DeletePlanUseCase {
  constructor(private readonly plans: PlanRepository) {}
  execute(planId: string) { return this.plans.softDelete(planId); }
}
