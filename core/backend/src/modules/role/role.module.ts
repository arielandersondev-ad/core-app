import { Module } from "@nestjs/common";
import { PrismaRoleRepository } from "./infrastructure/prisma-role.repository.js";
import { RoleController } from "./presentation/http/role.controller.js";
import { ListRolesByOrganizationScopeUseCase } from "./application/use-case/list-roles.use-case.js";
import { RoleRepository } from "./domain/repositories/role.repository.js";

@Module({
  imports: [],
  controllers: [
    RoleController,
  ],
  providers: [
    {
      provide: RoleRepository,
      useClass: PrismaRoleRepository,
    },
    ListRolesByOrganizationScopeUseCase,
  ],
  exports: [],
})
export class RoleModule {}
