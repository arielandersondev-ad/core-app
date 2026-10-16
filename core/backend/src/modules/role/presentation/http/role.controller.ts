import { Controller, Get, Body, Post, Put, Query, UseGuards, Param } from "@nestjs/common";
import { ListRolesByOrganizationScopeUseCase } from "../../application/use-case/list-roles.use-case.js";
import { ListRolesQueryDto } from "../dto/list-roles.query.dto.js";
import { CreateRoleUseCase } from "../../application/use-case/create-role.use-case.js";
import { CreateRoleDto } from "../dto/create-role.dto.js";
import { JwtAuthGuard } from "../../../auth/presentation/http/guards/jwt-auth.guard.js";
import { CoreAccessGuard } from "../../../auth/presentation/http/guards/core-access.guard.js";
import { RequireCoreAccess } from "../../../auth/presentation/http/decorators/require-core-access.decorator.js";
import { ListPermissionByRoleIdUseCase } from "../../application/use-case/list-permmision.use-case.js";
import { CreatePermissionUseCase } from '../../application/use-case/create-permission.use-case.js';
import { CreatePermissionDto } from '../dto/create-permission.dto.js';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto.js';
import { ReplaceRolePermissionsUseCase } from '../../application/use-case/replace-role-permissions.use-case.js';
import { ListAllPermissionsUseCase } from "../../application/use-case/list-all-permissions.use-case.js";

@Controller('role')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly listRolesUseCase: ListRolesByOrganizationScopeUseCase,
    private readonly listPermissionUseCase: ListPermissionByRoleIdUseCase,
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly replaceRolePermissionsUseCase: ReplaceRolePermissionsUseCase,
    private readonly listAllPermissionsUseCase: ListAllPermissionsUseCase
  ) {}

  @Post('permissions')
  @RequireCoreAccess('roles:create')
  createPermission(@Body() body: CreatePermissionDto) {
    return this.createPermissionUseCase.execute(body);
  }

  @Put(':roleId/permissions')
  @RequireCoreAccess('roles:update')
  replaceRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: ReplaceRolePermissionsDto,
  ) {
    return this.replaceRolePermissionsUseCase.execute(roleId, body.permissionIds);
  }

  @Get('permissions')
  @RequireCoreAccess('roles:read')
  async permission(){
    return await this.listAllPermissionsUseCase.execute()
  }

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
