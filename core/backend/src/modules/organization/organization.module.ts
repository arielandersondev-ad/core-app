import { Module } from '@nestjs/common';
import { PrismaOrganizationRepository } from './infrastructure/prisma-organization.repository.js';
import { PrismaBranchRepository } from './infrastructure/prisma-branch.repository.js';
import { OrganizationController } from './presentation/http/organization.controller.js';
import { BranchController } from './presentation/http/branch.controller.js';
import { CreateOrganizationUseCase } from './application/use-case/create-organization.use-case.js';
import { CreateBranchUseCase } from './application/use-case/create-branch.use-case.js';
import { ListOrganizationsUseCase } from './application/use-case/list-organizations.use-case.js';
import { ListBranchesByOrganizationUseCase } from './application/use-case/list-branches.use-case.js';
import { OrganizationRepository } from './domain/repositories/organization.repository.js';
import { BranchRepository } from './domain/repositories/branch.repository.js';
import { RoleModule } from '../role/role.module.js';
import { PrismaOrganizationWriter } from './infrastructure/prisma-organization.writer.js';
import { PrismaBranchWriter } from './infrastructure/prisma-branch.writer.js';
import { PrismaOrganizationProvisioningRepository } from './infrastructure/prisma-organization-provisioning.repository.js';
import { OrganizationProvisioningRepository } from './domain/repositories/organization-provisioning.repository.js';
import { CreateOrganizationSetupUseCase } from './application/use-case/create-organization-setup.use-case.js';

@Module({
  imports: [RoleModule],
  controllers: [OrganizationController, BranchController],
  providers: [
    PrismaOrganizationWriter,
    PrismaBranchWriter,
    {
      provide: OrganizationRepository,
      useClass: PrismaOrganizationRepository,
    },
    {
      provide: BranchRepository,
      useClass: PrismaBranchRepository,
    },
    {
      provide: OrganizationProvisioningRepository,
      useClass: PrismaOrganizationProvisioningRepository,
    },
    CreateOrganizationUseCase,
    CreateOrganizationSetupUseCase,
    CreateBranchUseCase,
    ListOrganizationsUseCase,
    ListBranchesByOrganizationUseCase,
  ],
  exports: [],
})
export class OrganizationModule {}
