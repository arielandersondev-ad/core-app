import { Module } from "@nestjs/common";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository.js";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher.js";
import { UserController } from "./presentation/http/user.controller.js";
import { CreateUserUseCase } from "./application/use-case/create-user.use-case.js";
import { UserRepository } from "./domain/repositories/user.repository.js";
import { PasswordHasher } from "./domain/services/password-hasher.js";

@Module({
  imports: [],
  controllers: [
    UserController,
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
  ],
  exports: [UserRepository, PasswordHasher],
})
export class UserModule {}
