import { Controller, Get, Body, Post, Query, UseGuards, Param } from "@nestjs/common";
import { ListRolesByOrganizationScopeUseCase } from "../../application/use-case/list-roles.use-case.js";
import { ListRolesQueryDto } from "../dto/list-roles.query.dto.js";
import { CreateRoleUseCase } from "../../application/use-case/create-role.use-case.js";
import { CreateRoleDto } from "../dto/create-role.dto.js";
import { JwtAuthGuard } from "../../../auth/presentation/http/guards/jwt-auth.guard.js";
import { CoreAccessGuard } from "../../../auth/presentation/http/guards/core-access.guard.js";
import { RequireCoreAccess } from "../../../auth/presentation/http/decorators/require-core-access.decorator.js";
import { ListPermissionByRoleIdUseCase } from "../../application/use-case/list-permmision.use-case.js";

@Controller('role')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesByOrganizationScopeUseCase,
    private readonly listPermissionUseCase: ListPermissionByRoleIdUseCase
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
  
  @Get('permissions/:roleId')
  @RequireCoreAccess('roles:read')
  listPermissions(
    @Param('roleId') roleId: string
  ) {
    return this.listPermissionUseCase.execute(roleId);
  }
}
