import { Module } from "@nestjs/common";
import { PrismaRoleRepository } from "./infrastructure/prisma-role.repository.js";
import { RoleController } from "./presentation/http/role.controller.js";
import { ListRolesByOrganizationScopeUseCase } from "./application/use-case/list-roles.use-case.js";
import { RoleRepository } from "./domain/repositories/role.repository.js";
import { CreateRoleUseCase } from "./application/use-case/create-role.use-case.js";
import { AuthSecurityModule } from "../auth/auth-security.module.js";
import { ListPermissionByRoleIdUseCase } from "./application/use-case/list-permmision.use-case.js";
import { PermissionRepository } from "./domain/repositories/permission.repository.js";
import { PrismaPermissionRepository } from "./infrastructure/prisma-permission.repository.js";

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
    {
      provide: PermissionRepository,
      useClass: PrismaPermissionRepository,
    },
    ListRolesByOrganizationScopeUseCase,
    ListPermissionByRoleIdUseCase,
    CreateRoleUseCase
  ],
  exports: [],
})
export class RoleModule {}
