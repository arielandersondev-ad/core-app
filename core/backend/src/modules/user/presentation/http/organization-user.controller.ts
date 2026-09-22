import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { ListOrganizationUsersUseCase } from '../../application/use-case/list-organization-users.use-case.js';
import { OrganizationUsersParamsDto } from '../dto/organization-users.params.dto.js';
import { OrganizationUserAccessGuard } from './guards/organization-user-access.guard.js';
import type { OrganizationUserRequest } from './types/organization-user-request.js';

@Controller('organizations/:organizationId/users')
@UseGuards(JwtAuthGuard, OrganizationUserAccessGuard)
export class OrganizationUserController {
  constructor(
    private readonly listOrganizationUsers: ListOrganizationUsersUseCase,
  ) {}

  @Get()
  list(
    @Param() _params: OrganizationUsersParamsDto,
    @Req() request: OrganizationUserRequest,
  ) {
    return this.listOrganizationUsers.execute(request.userListScope!);
  }
}
