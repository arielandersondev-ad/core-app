import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DentistryPrincipal } from '../../application/contracts/dentistry-principal.js';
import { CurrentPrincipal } from './decorators/current-principal.decorator.js';
import { DentistryJwtGuard } from './guards/dentistry-jwt.guard.js';

@Controller('auth')
@UseGuards(DentistryJwtGuard)
export class DentistryAuthController {
  @Get('me')
  me(@CurrentPrincipal() principal: DentistryPrincipal) {
    return {
      user: { id: principal.sub },
      context: {
        membershipId: principal.membershipId,
        organizationId: principal.organizationId,
        branchIds: principal.branchIds,
      },
      permissions: principal.permissions,
    };
  }
}
