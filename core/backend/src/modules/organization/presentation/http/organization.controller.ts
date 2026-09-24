import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrganizationUseCase } from '../../application/use-case/create-organization.use-case.js';
import { ListOrganizationsUseCase } from '../../application/use-case/list-organizations.use-case.js';
import { ListBranchesByOrganizationUseCase } from '../../application/use-case/list-branches.use-case.js';
import { CreateOrganizationDto } from '../dto/create-organization.dto.js';
import { CreateOrganizationSetupUseCase } from '../../application/use-case/create-organization-setup.use-case.js';
import { ReqCreateOrganizationSetupDto } from '../dto/organization-setup.dto.js';

@Controller('organizations')
//@UseGuards(JwtAuthGuard) PARA UNA FUTURA IMPLEMENTACION DE AUTENTICACION
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
  async createOrganization(@Body() data: CreateOrganizationDto) {
    return await this.createOrganizationUseCase.execute(data);
  }

  @Get()
  async listOrganizations() {
    return await this.listOrganizationsUseCase.execute();
  }

  @Get(':organizationId/branches')
  async listBranches(@Param('organizationId') organizationId: string) {
    return await this.listBranchesByOrganizationUseCase.execute(organizationId);
  }
}
