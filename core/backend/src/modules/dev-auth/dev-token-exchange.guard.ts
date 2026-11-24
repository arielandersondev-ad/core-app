import { createHash, timingSafeEqual } from 'node:crypto';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  DEV_EXCHANGE_SECRET_HEADER,
  devTokenExchangeSecret,
} from './dev-token-exchange.config.js';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/**
 * Protege el canje de tokens de desarrollo. Comprueba en cada petición que el
 * canje siga habilitado (defensa en profundidad: el módulo ya solo se registra
 * en desarrollo) y que llegue el secreto compartido.
 */
@Injectable()
export class DevTokenExchangeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = devTokenExchangeSecret();
    if (!secret) throw new NotFoundException();

    const header = context
      .switchToHttp()
      .getRequest<Request>()
      .headers[DEV_EXCHANGE_SECRET_HEADER];
    const provided = Array.isArray(header) ? header[0] : header;
    if (typeof provided !== 'string' || !timingSafeEqual(digest(provided), digest(secret))) {
      throw new UnauthorizedException('Secreto de canje inválido.');
    }
    return true;
  }
}
