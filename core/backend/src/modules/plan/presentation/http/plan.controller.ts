import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { CoreAccessGuard } from '../../../auth/presentation/http/guards/core-access.guard.js';
import { RequireCoreAccess } from '../../../auth/presentation/http/decorators/require-core-access.decorator.js';
import {
  CreatePlanUseCase,
  DeletePlanUseCase,
  GetPlanUseCase,
  ListPlansUseCase,
  UpdatePlanUseCase,
} from '../../application/use-case/plan-catalog.use-cases.js';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto.js';
import { ListPlanAssignmentsQueryDto } from '../dto/plan-assignment.dto.js';
import { PlanParamDto } from '../dto/plan-param.dto.js';
import { ListPlanAssignmentsUseCase } from '../../application/use-case/plan-assignment.use-cases.js';

@Controller('plans')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class PlanController {
  constructor(
    private readonly listPlans: ListPlansUseCase,
    private readonly getPlan: GetPlanUseCase,
    private readonly createPlan: CreatePlanUseCase,
    private readonly updatePlan: UpdatePlanUseCase,
    private readonly deletePlan: DeletePlanUseCase,
    private readonly listAssignments: ListPlanAssignmentsUseCase,
  ) {}

  @Get()
  @RequireCoreAccess('plans:read')
  list() { return this.listPlans.execute(); }

  @Get('assignments')
  @RequireCoreAccess('plans:read')
  assignments(@Query() query: ListPlanAssignmentsQueryDto) {
    return this.listAssignments.execute(query.organizationId);
  }

  @Get(':planId')
  @RequireCoreAccess('plans:read')
  get(@Param() params: PlanParamDto) { return this.getPlan.execute(params.planId); }

  @Post()
  @RequireCoreAccess('plans:create')
  create(@Body() body: CreatePlanDto) {
    return this.createPlan.execute({
      ...body,
      description: body.description ?? null,
      configuration: body.configuration ?? {},
      priceMinor: body.priceMinor ?? null,
      currency: body.currency ?? null,
      active: body.active ?? true,
    });
  }

  @Patch(':planId')
  @RequireCoreAccess('plans:update')
  update(@Param() params: PlanParamDto, @Body() body: UpdatePlanDto) {
    return this.updatePlan.execute(params.planId, body);
  }

  @Delete(':planId')
  @RequireCoreAccess('plans:delete')
  remove(@Param() params: PlanParamDto) { return this.deletePlan.execute(params.planId); }
}
