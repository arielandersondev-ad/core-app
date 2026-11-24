import { Controller, Get, UseGuards } from '@nestjs/common';
import { TimeZoneResolver } from '../../../../common/infrastructure/time-zone.resolver.js';
import type { DentistryPrincipal } from '../../application/contracts/dentistry-principal.js';
import { PlanEntitlementsReader } from '../../application/ports/plan-entitlements.reader.js';
import { SessionProfileReader } from '../../application/ports/session-profile.reader.js';
import { CurrentPrincipal } from './decorators/current-principal.decorator.js';
import { DentistryJwtGuard } from './guards/dentistry-jwt.guard.js';

@Controller('auth')
@UseGuards(DentistryJwtGuard)
export class DentistryAuthController {
  constructor(
    private readonly entitlements: PlanEntitlementsReader,
    private readonly timeZones: TimeZoneResolver,
    private readonly profiles: SessionProfileReader,
  ) {}

  @Get('me')
  async me(@CurrentPrincipal() principal: DentistryPrincipal) {
    const [plan, zones, profile] = await Promise.all([
      this.entitlements.read(principal.organizationId),
      this.timeZones.forBranches(principal.organizationId, principal.branchIds),
      this.profiles.read(principal.sub, principal.organizationId),
    ]);
    return {
      // Nombres solo para mostrar; la identidad sigue siendo el id del token.
      user: {
        id: principal.sub,
        firstName: profile.user?.firstName ?? null,
        lastName: profile.user?.lastName ?? null,
      },
      context: {
        membershipId: principal.membershipId,
        organizationId: principal.organizationId,
        organizationName: profile.organizationName,
        branchIds: principal.branchIds,
        // Zonas IANA para mostrar y capturar fechas de calendario.
        timeZone: zones.organization,
        branchTimeZones: Object.fromEntries(zones.branches),
      },
      permissions: principal.permissions,
      // null: sin plan vigente; modules null: el plan no restringe módulos.
      plan,
    };
  }
}
