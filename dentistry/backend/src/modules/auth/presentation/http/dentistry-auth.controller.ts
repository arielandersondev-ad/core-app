import { Controller, Get, UseGuards } from '@nestjs/common';
import { TimeZoneResolver } from '../../../../common/infrastructure/time-zone.resolver.js';
import type { DentistryPrincipal } from '../../application/contracts/dentistry-principal.js';
import { PlanEntitlementsReader } from '../../application/ports/plan-entitlements.reader.js';
import { CurrentPrincipal } from './decorators/current-principal.decorator.js';
import { DentistryJwtGuard } from './guards/dentistry-jwt.guard.js';

@Controller('auth')
@UseGuards(DentistryJwtGuard)
export class DentistryAuthController {
  constructor(
    private readonly entitlements: PlanEntitlementsReader,
    private readonly timeZones: TimeZoneResolver,
  ) {}

  @Get('me')
  async me(@CurrentPrincipal() principal: DentistryPrincipal) {
    const [plan, zones] = await Promise.all([
      this.entitlements.read(principal.organizationId),
      this.timeZones.forBranches(principal.organizationId, principal.branchIds),
    ]);
    return {
      user: { id: principal.sub },
      context: {
        membershipId: principal.membershipId,
        organizationId: principal.organizationId,
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
