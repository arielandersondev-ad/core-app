import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.js';
import { AuthSessionRepository } from '../../../application/ports/auth-session.repository.js';
import type { AuthenticatedPrincipal } from '../../../application/contracts/authenticated-principal.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

const BEARER_PATTERN = /^Bearer ([^\s]+)$/i;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: AccessTokenVerifier,
    private readonly sessions: AuthSessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (typeof authorization !== 'string') {
      throw new UnauthorizedException('Token de acceso requerido');
    }

    const match = BEARER_PATTERN.exec(authorization);
    if (!match) {
      throw new UnauthorizedException('Token de acceso inválido');
    }

    let principal: AuthenticatedPrincipal;
    try {
      principal = await this.tokenVerifier.verify(match[1]);
    } catch {
      throw new UnauthorizedException('Token de acceso inválido');
    }

    // El logout revoca la AuthSession; Core deja de aceptar sus access tokens de inmediato.
    const session = await this.sessions.findById(principal.sessionId);
    if (
      !session ||
      session.userId !== principal.sub ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Sesión revocada o expirada');
    }

    request.user = principal;
    return true;
  }
}
