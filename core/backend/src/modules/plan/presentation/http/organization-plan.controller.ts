import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { CoreAccessGuard } from '../../../auth/presentation/http/guards/core-access.guard.js';
import { RequireCoreAccess } from '../../../auth/presentation/http/decorators/require-core-access.decorator.js';
import {
  AssignPlanUseCase,
  ChangePlanAssignmentStatusUseCase,
  ListPlanAssignmentsUseCase,
} from '../../application/use-case/plan-assignment.use-cases.js';
import {
  AssignPlanDto,
  ChangePlanAssignmentStatusDto,
  OrganizationPlanParamsDto,
} from '../dto/plan-assignment.dto.js';
import { OrganizationParamDto } from '../dto/plan-param.dto.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class OrganizationPlanController {
  constructor(
    private readonly listAssignments: ListPlanAssignmentsUseCase,
    private readonly assignPlan: AssignPlanUseCase,
    private readonly changeStatus: ChangePlanAssignmentStatusUseCase,
  ) {}

  @Get(':organizationId/plans')
  @RequireCoreAccess('plans:read')
  list(@Param() params: OrganizationParamDto) {
    return this.listAssignments.execute(params.organizationId);
  }

  @Put(':organizationId/plans/:vertical')
  @RequireCoreAccess('plans:assign')
  assign(@Param() params: OrganizationPlanParamsDto, @Body() body: AssignPlanDto) {
    return this.assignPlan.execute({ ...params, ...body });
  }

  @Patch(':organizationId/plans/:vertical/status')
  @RequireCoreAccess('plans:assign')
  status(
    @Param() params: OrganizationPlanParamsDto,
    @Body() body: ChangePlanAssignmentStatusDto,
  ) {
    return this.changeStatus.execute({ ...params, ...body });
  }
}
