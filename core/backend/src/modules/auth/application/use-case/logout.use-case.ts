import { Injectable } from '@nestjs/common';
import { AuthSessionRepository } from '../ports/auth-session.repository.js';
import { parseRefreshToken, refreshHashMatches } from '../services/refresh-token.js';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessions: AuthSessionRepository) {}

  /** Revoca la sesión del refresh token. Es idempotente y no revela si la sesión existía. */
  async execute(refreshToken: string, now = new Date()): Promise<void> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) return;

    const session = await this.sessions.findById(parsed.sessionId);
    if (
      !session ||
      session.revokedAt ||
      !refreshHashMatches(parsed.secret, session.refreshTokenHash)
    ) {
      return;
    }
    await this.sessions.revoke(session.id, now);
  }

  /** Revoca todas las sesiones activas del usuario (cerrar sesión en todos los dispositivos). */
  async executeForUser(userId: string, now = new Date()): Promise<void> {
    await this.sessions.revokeAllForUser(userId, now);
  }
}
