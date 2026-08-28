import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../../../user/domain/repositories/user.repository.js';
import { PasswordHasher } from '../../../user/domain/services/password-hasher.js';
import { AccessTokenIssuer } from '../ports/access-token-issuer.js';
import type { AuthResult } from '../contracts/auth-result.js';
import type { AuthenticatedPrincipal } from '../contracts/authenticated-principal.js';
import { LoginDto } from '../../presentation/dto/login.dto.js';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenIssuer: AccessTokenIssuer,
  ) {}

  async execute(credentials: LoginDto): Promise<AuthResult> {
    const record = await this.userRepo.findAuthRecord(
      credentials.email,
      credentials.organizationId,
    );

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

    const principal: AuthenticatedPrincipal = {
      sub: record.user.id,
      email: record.user.email,
      membershipId: record.membershipId,
      organizationId: record.organizationId,
      branchIds: record.branchIds,
      roleCodes: record.roleCodes,
    };

    const access_token = await this.tokenIssuer.sign(principal);

    return {
      access_token,
      user: {
        id: record.user.id,
        email: record.user.email,
        firstName: record.user.firstName,
        lastName: record.user.lastName,
        membershipId: record.membershipId,
        organizationId: record.organizationId,
        branchIds: record.branchIds,
        roleIds: record.roleIds,
        roleCodes: record.roleCodes,
      },
    };
  }
}
