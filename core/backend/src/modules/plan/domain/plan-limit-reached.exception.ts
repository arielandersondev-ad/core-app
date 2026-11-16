import { ForbiddenException } from '@nestjs/common';

export type PlanLimitResource = 'patients' | 'users' | 'branches';

const RESOURCE_LABELS: Record<PlanLimitResource, string> = {
  patients: 'pacientes',
  users: 'usuarios',
  branches: 'sucursales',
};

/** Raised when an organization reached a quota of its current plan. */
export class PlanLimitReachedException extends ForbiddenException {
  constructor(resource: PlanLimitResource, limit: number) {
    super({
      statusCode: 403,
      code: 'PLAN_LIMIT_REACHED',
      resource,
      limit,
      message: `El plan actual permite hasta ${limit} ${RESOURCE_LABELS[resource]}. Mejora tu plan para agregar más.`,
    });
  }
}
