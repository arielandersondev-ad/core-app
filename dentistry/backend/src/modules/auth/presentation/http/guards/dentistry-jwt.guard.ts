import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { DentistryTokenVerifier } from '../../../infrastructure/jwt/dentistry-token.verifier.js';
import type { AuthenticatedRequest } from '../decorators/current-principal.decorator.js';

@Injectable()
export class DentistryJwtGuard implements CanActivate {
  constructor(private readonly verifier: DentistryTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization || !/^Bearer \S+$/.test(authorization)) {
      throw new UnauthorizedException('Access token requerido');
    }
    try {
      const principal = await this.verifier.verify(authorization.slice(7));
      (request as AuthenticatedRequest).user = principal;
      return true;
    } catch {
      throw new UnauthorizedException('Access token inválido o expirado');
    }
  }
}
