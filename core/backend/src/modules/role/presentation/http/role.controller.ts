import { Controller, Get, Body, Post, Query, UseGuards } from "@nestjs/common";
import { ListRolesByOrganizationScopeUseCase } from "../../application/use-case/list-roles.use-case.js";
import { ListRolesQueryDto } from "../dto/list-roles.query.dto.js";
import { CreateRoleUseCase } from "../../application/use-case/create-role.use-case.js";
import { CreateRoleDto } from "../dto/create-role.dto.js";
import { JwtAuthGuard } from "../../../auth/presentation/http/guards/jwt-auth.guard.js";
import { CoreAccessGuard } from "../../../auth/presentation/http/guards/core-access.guard.js";
import { RequireCoreAccess } from "../../../auth/presentation/http/decorators/require-core-access.decorator.js";

@Controller('role')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class RoleController {
  constructor(
    private readonly listRolesUseCase: ListRolesByOrganizationScopeUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase
  ) {}
  @Post('create')
  @RequireCoreAccess('roles:create')
  async createRole(
    @Body() body: CreateRoleDto
  ) {
    return await this.createRoleUseCase.execute(body)
  }
  @Get("get-list-org")
  @RequireCoreAccess('roles:read')
  async listRoles(
    @Query() query: ListRolesQueryDto
  ) {
    return await this.listRolesUseCase.execute(query.organizationId);
  }
}
