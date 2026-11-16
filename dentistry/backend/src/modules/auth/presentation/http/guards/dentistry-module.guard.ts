import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  isModuleEnabled,
  type DentistryModule,
} from '../../../application/contracts/plan-entitlements.js';
import { PlanEntitlementsReader } from '../../../application/ports/plan-entitlements.reader.js';
import type { AuthenticatedRequest } from '../decorators/current-principal.decorator.js';
import { REQUIRED_MODULE } from '../decorators/require-module.decorator.js';

/** Rejects requests to modules that the organization's current plan does not include. */
@Injectable()
export class DentistryModuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements: PlanEntitlementsReader,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const module = this.reflector.getAllAndOverride<DentistryModule>(REQUIRED_MODULE, [
      context.getHandler(), context.getClass(),
    ]);
    if (!module) return true;
    const principal = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    const entitlements = principal
      ? await this.entitlements.read(principal.organizationId)
      : null;
    if (!entitlements || !isModuleEnabled(entitlements, module)) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'MODULE_NOT_IN_PLAN',
        module,
        message: 'Este módulo no está incluido en tu plan.',
      });
    }
    return true;
  }
}
