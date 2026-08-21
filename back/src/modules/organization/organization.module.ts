import { Module } from "@nestjs/common";
import { PrismaOrganizationRepository } from "./infrastructure/prisma-organization.repository.js";
import { OrganizationController } from "./presentation/http/organization.controller.js";
import { PrismaOrganizationUseCase } from "./application/use-case/create-organization.use-case.js";
import { OrganizationRepository } from "./domain/repositories/organization.repository.js";

@Module({
    imports: [],
    controllers: [
        OrganizationController,
    ],
    providers: [
        {
            provide: OrganizationRepository,
            useClass: PrismaOrganizationRepository,
        },
        PrismaOrganizationUseCase,
    ],
    exports: [],
})
export class OrganizationModule {}