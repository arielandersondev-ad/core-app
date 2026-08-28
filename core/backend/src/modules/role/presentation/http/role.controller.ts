import { Controller, Get, Query } from "@nestjs/common";
import { ListRolesByOrganizationScopeUseCase } from "../../application/use-case/list-roles.use-case.js";
import { ListRolesQueryDto } from "../dto/list-roles.query.dto.js";

@Controller('roles')
export class RoleController {
  constructor(
    private readonly listRolesUseCase: ListRolesByOrganizationScopeUseCase,
  ) {}

  @Get()
  async listRoles(
    @Query() query: ListRolesQueryDto
  ) {
    return await this.listRolesUseCase.execute(query.organizationId);
  }
}
