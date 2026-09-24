import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CreateOrganizationUseCase } from "../../application/use-case/create-organization.use-case.js";
import { ListOrganizationsUseCase } from "../../application/use-case/list-organizations.use-case.js";
import { ListBranchesByOrganizationUseCase } from "../../application/use-case/list-branches.use-case.js";
import { CreateOrganizationDto } from "../dto/create-organization.dto.js";
import { CreateOrganizationSetupUseCase } from '../../application/use-case/create-organization-setup.use-case.js';
import { ReqCreateOrganizationSetupDto } from '../dto/organization-setup.dto.js';
import { JwtAuthGuard } from '../../../auth/presentation/http/guards/jwt-auth.guard.js';
import { CoreAccessGuard } from '../../../auth/presentation/http/guards/core-access.guard.js';
import { RequireCoreAccess } from '../../../auth/presentation/http/decorators/require-core-access.decorator.js';

@Controller('organizations')
@UseGuards(JwtAuthGuard, CoreAccessGuard)
export class OrganizationController {
  constructor(
    private readonly createOrganizationUseCase: CreateOrganizationUseCase,
    private readonly createOrganizationSetupUseCase: CreateOrganizationSetupUseCase,
    private readonly listOrganizationsUseCase: ListOrganizationsUseCase,
    private readonly listBranchesByOrganizationUseCase: ListBranchesByOrganizationUseCase,
  ) {}

  @Post('setup')
  createSetup(@Body() data: ReqCreateOrganizationSetupDto) {
    return this.createOrganizationSetupUseCase.execute(data);
  }

    @Post()
    @RequireCoreAccess('organizations:create')
    async createOrganization(
        @Body() data: CreateOrganizationDto
    ) {
        return await this.createOrganizationUseCase.execute(data);
    }

    @Get()
    @RequireCoreAccess('organizations:read')
    async listOrganizations() {
        return await this.listOrganizationsUseCase.execute();
    }

    @Get(':organizationId/branches')
    @RequireCoreAccess('organizations:read')
    async listBranches(
        @Param('organizationId') organizationId: string
    ) {
        return await this.listBranchesByOrganizationUseCase.execute(organizationId);
    }
}
