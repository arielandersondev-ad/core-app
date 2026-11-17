import { ForbiddenException } from '@nestjs/common';

/** Mismo cuerpo que el `PLAN_LIMIT_REACHED` de Core: los clientes manejan una sola forma. */
export class PlanLimitReachedException extends ForbiddenException {
  constructor(resource: 'patients', limit: number) {
    super({
      statusCode: 403,
      error: 'Forbidden',
      code: 'PLAN_LIMIT_REACHED',
      resource,
      limit,
      message: `El plan actual permite hasta ${limit} pacientes. Mejora tu plan para agregar más.`,
    });
  }
}
