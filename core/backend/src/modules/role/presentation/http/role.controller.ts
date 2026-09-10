import { Controller, Get, Body, Post, Query } from "@nestjs/common";
import { ListRolesByOrganizationScopeUseCase } from "../../application/use-case/list-roles.use-case.js";
import { ListRolesQueryDto } from "../dto/list-roles.query.dto.js";
import { CreateRoleUseCase } from "../../application/use-case/create-role.use-case.js";
import { CreateRoleDto } from "../dto/create-role.dto.js";

@Controller('role')
export class RoleController {
  constructor(
    private readonly listRolesUseCase: ListRolesByOrganizationScopeUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase
  ) {}
  @Post('create')
  async createRole(
    @Body() body: CreateRoleDto
  ) {
    return await this.createRoleUseCase.execute(body)
  }
  @Get("get-list")
  async listRoles(
    @Query() query: ListRolesQueryDto
  ) {
    return await this.listRolesUseCase.execute(query.organizationId);
  }
}
