import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../../../user/domain/repositories/user.repository.js';
import type { AuthResult } from '../contracts/auth-result.js';
import type { TokenAudience } from '../contracts/token-audience.js';
import { TOKEN_AUDIENCES } from '../contracts/token-audience.js';
import { VerticalAccessPolicy } from '../ports/vertical-access-policy.js';
import { AuthSessionRepository } from '../ports/auth-session.repository.js';
import {
  authSessionIdleTimeoutSeconds,
  REFRESH_REUSE_GRACE_MS,
} from '../contracts/auth-session-policy.js';
import { AuthSessionIssuer } from '../services/auth-session-issuer.js';
import {
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
  refreshHashMatches,
} from '../services/refresh-token.js';

const INVALID_SESSION = 'Sesión inválida o expirada';
const REFRESH_IN_PROGRESS = 'La sesión se está renovando; reintenta la petición';

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: AuthSessionRepository,
    private readonly users: UserRepository,
    private readonly verticalAccessPolicy: VerticalAccessPolicy,
    private readonly sessionIssuer: AuthSessionIssuer,
  ) {}

  async execute(refreshToken: string, audience: TokenAudience, now = new Date()): Promise<AuthResult> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) throw new UnauthorizedException(INVALID_SESSION);

    const session = await this.sessions.findById(parsed.sessionId);
    if (!session || session.revokedAt) throw new UnauthorizedException(INVALID_SESSION);

    if (!refreshHashMatches(parsed.secret, session.refreshTokenHash)) {
      // Token ya rotado. Dentro de la ventana de gracia es una carrera legítima entre
      // peticiones del mismo cliente; fuera de ella se trata como reutilización (robo).
      if (session.lastUsedAt && now.getTime() - session.lastUsedAt.getTime() < REFRESH_REUSE_GRACE_MS) {
        throw new ConflictException(REFRESH_IN_PROGRESS);
      }
      await this.sessions.revoke(session.id, now);
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const lastActivity = session.lastUsedAt ?? session.createdAt;
    if (
      session.expiresAt.getTime() <= now.getTime() ||
      now.getTime() - lastActivity.getTime() > authSessionIdleTimeoutSeconds() * 1000
    ) {
      await this.sessions.revoke(session.id, now);
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const record = await this.users.findAuthRecordByUserId(session.userId);
    if (
      !record ||
      (record.passwordChangedAt !== null &&
        record.passwordChangedAt.getTime() > session.createdAt.getTime())
    ) {
      await this.sessions.revoke(session.id, now);
      throw new UnauthorizedException(INVALID_SESSION);
    }

    if (
      audience === TOKEN_AUDIENCES.dentistry &&
      !(await this.verticalAccessPolicy.canAccessDentistry(record.organizationId, now))
    ) {
      throw new ForbiddenException('La organización no tiene acceso a Dentistry');
    }

    const secret = generateRefreshSecret();
    const rotated = await this.sessions.rotate(
      session.id,
      session.refreshTokenHash,
      hashRefreshSecret(secret),
      now,
    );
    if (!rotated) throw new ConflictException(REFRESH_IN_PROGRESS);

    return await this.sessionIssuer.issue(
      record,
      audience,
      { id: session.id, secret, expiresAt: session.expiresAt },
      now,
    );
  }
}
