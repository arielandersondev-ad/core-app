import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../user/domain/repositories/user.repository.js';
import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';
import type { CurrentSessionView } from '../contracts/current-session-view.js';
import { permissionsForAudience } from '../services/audience-permission-filter.js';
import { TOKEN_AUDIENCES } from '../contracts/token-audience.js';

@Injectable()
export class GetCurrentSessionUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(principal: AuthenticatedPrincipal): Promise<CurrentSessionView> {
    const record = await this.users.findCurrentSession(
      principal.sub,
      principal.membershipId,
      principal.organizationId,
    );
    if (!record) throw new UnauthorizedException('Sesión inválida');

    return {
      user: {
        id: record.user.id,
        email: record.user.email,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
      },
      context: {
        membershipId: record.membershipId,
        organizationId: record.organizationId,
        branchIds: record.branchIds,
      },
      permissions: permissionsForAudience(record.permissions, TOKEN_AUDIENCES.core),
    };
  }
}
