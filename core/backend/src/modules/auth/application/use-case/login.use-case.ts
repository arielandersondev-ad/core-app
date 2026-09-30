import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../user/domain/repositories/user.repository.js';
import { PasswordHasher } from '../../../user/domain/services/password-hasher.js';
import { AccessTokenIssuer } from '../ports/access-token-issuer.js';
import type { AuthResult } from '../contracts/auth-result.js';
import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';
import type { TokenAudience } from '../contracts/token-audience.js';
import { TOKEN_AUDIENCES } from '../contracts/token-audience.js';
import { permissionsForAudience } from '../services/audience-permission-filter.js';
import { VerticalAccessPolicy } from '../ports/vertical-access-policy.js';
import { accessTokenLifetimeSeconds } from '../contracts/access-token-lifetime.js';
import { LoginDto } from '../../presentation/dto/login.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: AccessTokenIssuer,
    private readonly verticalAccessPolicy: VerticalAccessPolicy,
  ) {}

  async execute( credentials: LoginDto, audience: TokenAudience ): Promise<AuthResult> {
    const record = await this.userRepo.findAuthRecord(credentials.email);

    if (!record) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const valid = await this.passwordHasher.verify(
      credentials.password,
      record.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (
      audience === TOKEN_AUDIENCES.dentistry && !(await this.verticalAccessPolicy.canAccessDentistry(record.organizationId, new Date()))
    ) {
      throw new ForbiddenException('La organización no tiene acceso a Dentistry');
    }

    const principal: AuthenticatedPrincipal = {
      sub: record.user.id,
      membershipId: record.membershipId,
      organizationId: record.organizationId,
      branchIds: record.branchIds,
      permissions: permissionsForAudience(record.permissions, audience),
    };

    const access_token = await this.tokenIssuer.sign(principal, audience);

    return {
      access_token,
      token_type: 'Bearer',
      expires_in: accessTokenLifetimeSeconds(),
    };
  }
}
