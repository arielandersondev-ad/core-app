import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenVerifier } from '../../../application/ports/access-token-verifier.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

const BEARER_PATTERN = /^Bearer ([^\s]+)$/i;

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenVerifier: AccessTokenVerifier) {}

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

    try {
      request.user = await this.tokenVerifier.verify(match[1]);
      return true;
    } catch {
      throw new UnauthorizedException('Token de acceso inválido');
    }
  }
}
