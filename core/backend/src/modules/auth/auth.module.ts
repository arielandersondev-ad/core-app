import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './presentation/http/auth.controller.js';
import { LoginUseCase } from './application/use-case/login.use-case.js';
import { AuthSecurityModule } from './auth-security.module.js';
import { VerticalAccessPolicy } from './application/ports/vertical-access-policy.js';
import { PrismaVerticalAccessPolicy } from './infrastructure/security/prisma-vertical-access-policy.js';
import { GetCurrentSessionUseCase } from './application/use-case/get-current-session.use-case.js';
import { RefreshSessionUseCase } from './application/use-case/refresh-session.use-case.js';
import { LogoutUseCase } from './application/use-case/logout.use-case.js';
import { AuthSessionIssuer } from './application/services/auth-session-issuer.js';

@Module({
  imports: [UserModule, AuthSecurityModule],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    AuthSessionIssuer,
    GetCurrentSessionUseCase,
    { provide: VerticalAccessPolicy, useClass: PrismaVerticalAccessPolicy }],
  exports: [],
})
export class AuthModule {}
