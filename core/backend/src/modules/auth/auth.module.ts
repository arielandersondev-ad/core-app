import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { LoginUseCase } from './application/use-case/login.use-case.js';
import { AuthSecurityModule } from './auth-security.module.js';

@Module({
  imports: [UserModule, AuthSecurityModule],
  controllers: [AuthController],
  providers: [LoginUseCase],
  exports: [],
})
export class AuthModule {}
