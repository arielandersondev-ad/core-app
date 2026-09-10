import { Module } from "@nestjs/common";
import { PrismaOrganizationRepository } from "./infrastructure/prisma-organization.repository.js";
import { PrismaBranchRepository } from "./infrastructure/prisma-branch.repository.js";
import { OrganizationController } from "./presentation/http/organization.controller.js";
import { BranchController } from "./presentation/http/branch.controller.js";
import { CreateOrganizationUseCase } from "./application/use-case/create-organization.use-case.js";
import { CreateBranchUseCase } from "./application/use-case/create-branch.use-case.js";
import { ListOrganizationsUseCase } from "./application/use-case/list-organizations.use-case.js";
import { ListBranchesByOrganizationUseCase } from "./application/use-case/list-branches.use-case.js";
import { OrganizationRepository } from "./domain/repositories/organization.repository.js";
import { BranchRepository } from "./domain/repositories/branch.repository.js";

@Module({
    imports: [],
    controllers: [
        OrganizationController,
        BranchController,
    ],
    providers: [
        {
            provide: OrganizationRepository,
            useClass: PrismaOrganizationRepository,
        },
        {
            provide: BranchRepository,
            useClass: PrismaBranchRepository,
        },
        CreateOrganizationUseCase,
        CreateBranchUseCase,
        ListOrganizationsUseCase,
        ListBranchesByOrganizationUseCase,
    ],
    exports: [],
})
export class OrganizationModule {}
