import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../user/domain/repositories/user.repository.js';
import { PasswordHasher } from '../../../user/domain/services/password-hasher.js';
import type { AuthResult } from '../contracts/auth-result.js';
import type { TokenAudience } from '../contracts/token-audience.js';
import { TOKEN_AUDIENCES } from '../contracts/token-audience.js';
import { VerticalAccessPolicy } from '../ports/vertical-access-policy.js';
import { AuthSessionRepository } from '../ports/auth-session.repository.js';
import {
  authSessionLifetimeSeconds,
  FAILED_LOGIN_LOCK_DURATION_MS,
  FAILED_LOGIN_MAX_ATTEMPTS,
} from '../contracts/auth-session-policy.js';
import { AuthSessionIssuer } from '../services/auth-session-issuer.js';
import { generateRefreshSecret, hashRefreshSecret } from '../services/refresh-token.js';
import { LoginDto } from '../../presentation/dto/login.dto.js';

export type LoginClientContext = {
  ipAddress: string | null;
  userAgent: string | null;
};

@Injectable()
export class LoginUseCase {
  private dummyHash?: Promise<string>;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly verticalAccessPolicy: VerticalAccessPolicy,
    private readonly sessions: AuthSessionRepository,
    private readonly sessionIssuer: AuthSessionIssuer,
  ) {}

  async execute(
    credentials: LoginDto,
    audience: TokenAudience,
    client: LoginClientContext = { ipAddress: null, userAgent: null },
  ): Promise<AuthResult> {
    const record = await this.userRepo.findAuthRecord(credentials.email);

    if (!record) {
      // Igualar el costo del caso "usuario existe" para no revelar cuentas por tiempo de respuesta.
      await this.passwordHasher.verify(credentials.password, await this.getDummyHash());
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const now = new Date();
    const valid = await this.passwordHasher.verify(credentials.password, record.passwordHash);
    if (!valid) {
      await this.userRepo.registerFailedLogin(record.user.id, {
        maxAttempts: FAILED_LOGIN_MAX_ATTEMPTS,
        lockDurationMs: FAILED_LOGIN_LOCK_DURATION_MS,
        now,
      });
      throw new UnauthorizedException('Credenciales inválidas');
    }
    await this.userRepo.clearFailedLogins(record.user.id);

    if (
      audience === TOKEN_AUDIENCES.dentistry &&
      !(await this.verticalAccessPolicy.canAccessDentistry(record.organizationId, now))
    ) {
      throw new ForbiddenException('La organización no tiene acceso a Dentistry');
    }

    const secret = generateRefreshSecret();
    const session = await this.sessions.create({
      userId: record.user.id,
      refreshTokenHash: hashRefreshSecret(secret),
      ipAddress: client.ipAddress,
      userAgent: client.userAgent,
      expiresAt: new Date(now.getTime() + authSessionLifetimeSeconds() * 1000),
    });

    return await this.sessionIssuer.issue(
      record,
      audience,
      { id: session.id, secret, expiresAt: session.expiresAt },
      now,
    );
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= this.passwordHasher.hash(generateRefreshSecret());
    return this.dummyHash;
  }
}
