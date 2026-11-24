import { Logger, Module, type OnModuleInit } from '@nestjs/common';
import { VerticalAccessPolicy } from '../auth/application/ports/vertical-access-policy.js';
import { AuthSessionIssuer } from '../auth/application/services/auth-session-issuer.js';
import { AuthSecurityModule } from '../auth/auth-security.module.js';
import { PrismaVerticalAccessPolicy } from '../auth/infrastructure/security/prisma-vertical-access-policy.js';
import { UserModule } from '../user/user.module.js';
import { DevAuthController } from './dev-auth.controller.js';
import { DevTokenExchangeGuard } from './dev-token-exchange.guard.js';
import { DevTokenExchangeUseCase } from './dev-token-exchange.use-case.js';

/**
 * Canje de tokens de desarrollo. `AppModule` solo lo importa cuando
 * `devTokenExchangeEnabled()` (NODE_ENV=development y secreto configurado);
 * en cualquier otro entorno estas rutas no existen.
 */
@Module({
  imports: [UserModule, AuthSecurityModule],
  controllers: [DevAuthController],
  providers: [
    DevTokenExchangeGuard,
    DevTokenExchangeUseCase,
    AuthSessionIssuer,
    { provide: VerticalAccessPolicy, useClass: PrismaVerticalAccessPolicy },
  ],
})
export class DevAuthModule implements OnModuleInit {
  onModuleInit(): void {
    new Logger(DevAuthModule.name).warn(
      'CANJE DE TOKENS DE DESARROLLO ACTIVO: emite sesiones sin contraseña. Nunca habilitar fuera de desarrollo local.',
    );
  }
}
