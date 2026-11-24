import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AuthResult } from '../auth/application/contracts/auth-result.js';
import { authSessionLifetimeSeconds } from '../auth/application/contracts/auth-session-policy.js';
import { TOKEN_AUDIENCES } from '../auth/application/contracts/token-audience.js';
import { AuthSessionRepository } from '../auth/application/ports/auth-session.repository.js';
import { VerticalAccessPolicy } from '../auth/application/ports/vertical-access-policy.js';
import { AuthSessionIssuer } from '../auth/application/services/auth-session-issuer.js';
import { generateRefreshSecret, hashRefreshSecret } from '../auth/application/services/refresh-token.js';
import { UserRepository } from '../user/domain/repositories/user.repository.js';

export type DevUserOption = {
  id: string;
  email: string;
  name: string;
  organizationName: string | null;
  roleNames: string[];
  branchNames: string[];
};

const MAX_USERS = 50;

/**
 * Canje de desarrollo: emite una sesión de Dentistry para un usuario real sin
 * pedir su contraseña. Reutiliza el mismo registro de acceso (permisos, sucursales,
 * membresía) y el mismo emisor que el login, así el token es idéntico al real y
 * la renovación funciona. Solo se registra en `NODE_ENV=development`.
 */
@Injectable()
export class DevTokenExchangeUseCase {
  private readonly logger = new Logger(DevTokenExchangeUseCase.name);

  constructor(
    private readonly users: UserRepository,
    private readonly access: VerticalAccessPolicy,
    private readonly sessions: AuthSessionRepository,
    private readonly issuer: AuthSessionIssuer,
  ) {}

  async listUsers(search?: string): Promise<DevUserOption[]> {
    const result = await this.users.listUsers({
      search: search?.trim() || undefined,
      status: 'ACTIVE',
      page: 1,
      pageSize: MAX_USERS,
    });
    return result.items.map((user) => {
      const membership = user.memberships[0];
      return {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        organizationName: membership?.organizationName ?? null,
        roleNames: membership?.roleNames ?? [],
        branchNames: membership?.branchNames ?? [],
      };
    });
  }

  async exchange(userId: string, now: Date = new Date()): Promise<AuthResult> {
    const record = await this.users.findAuthRecordByUserId(userId);
    if (!record) {
      throw new NotFoundException(
        'El usuario no existe, está inactivo o no tiene exactamente una membresía activa.',
      );
    }
    if (!(await this.access.canAccessDentistry(record.organizationId, now))) {
      throw new ForbiddenException('La organización no tiene acceso a Dentistry');
    }

    const secret = generateRefreshSecret();
    const session = await this.sessions.create({
      userId: record.user.id,
      refreshTokenHash: hashRefreshSecret(secret),
      ipAddress: null,
      userAgent: 'dev-token-exchange',
      expiresAt: new Date(now.getTime() + authSessionLifetimeSeconds() * 1000),
    });

    this.logger.warn(
      `Canje de desarrollo: sesión de Dentistry para el usuario ${record.user.id} (organización ${record.organizationId}).`,
    );
    return await this.issuer.issue(
      record,
      TOKEN_AUDIENCES.dentistry,
      { id: session.id, secret, expiresAt: session.expiresAt },
      now,
    );
  }
}
