import { Module } from "@nestjs/common";
import { PrismaRoleRepository } from "./infrastructure/prisma-role.repository.js";
import { RoleController } from "./presentation/http/role.controller.js";
import { ListRolesByOrganizationScopeUseCase } from "./application/use-case/list-roles.use-case.js";
import { RoleRepository } from "./domain/repositories/role.repository.js";
import { CreateRoleUseCase } from "./application/use-case/create-role.use-case.js";
import { AuthSecurityModule } from "../auth/auth-security.module.js";

@Module({
  imports: [
    AuthSecurityModule
  ],
  controllers: [
    RoleController,
  ],
  providers: [
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
    ListRolesByOrganizationScopeUseCase,
    CreateRoleUseCase
  ],
  exports: [],
})
export class RoleModule {}
