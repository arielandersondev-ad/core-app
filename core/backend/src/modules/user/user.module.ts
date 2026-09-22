import { Module } from "@nestjs/common";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository.js";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher.js";
import { UserController } from "./presentation/http/user.controller.js";
import { CreateUserUseCase } from "./application/use-case/create-user.use-case.js";
import { UserRepository } from "./domain/repositories/user.repository.js";
import { PasswordHasher } from "./domain/services/password-hasher.js";
import { AuthSecurityModule } from '../auth/auth-security.module.js';
import { ListUsersUseCase } from './application/use-case/list-users.use-case.js';
import { ListOrganizationUsersUseCase } from './application/use-case/list-organization-users.use-case.js';
import { OrganizationUserController } from './presentation/http/organization-user.controller.js';
import { OrganizationUserAccessGuard } from './presentation/http/guards/organization-user-access.guard.js';

@Module({
  imports: [AuthSecurityModule],
  controllers: [
    UserController,
    OrganizationUserController,
  ],
  providers: [
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
    {
      provide: PasswordHasher,
      useClass: BcryptPasswordHasher,
    },
    CreateUserUseCase,
    ListUsersUseCase,
    ListOrganizationUsersUseCase,
    OrganizationUserAccessGuard,
  ],
  exports: [UserRepository, PasswordHasher],
})
export class UserModule {}
