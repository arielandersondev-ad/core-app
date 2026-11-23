import { ForbiddenException } from '@nestjs/common';

export type PlanLimitResource = 'patients' | 'fileStorageBytes' | 'filesPerPatient';

function megabytes(bytes: number): string {
  return `${Math.floor(bytes / (1024 * 1024))} MB`;
}

const MESSAGES: Record<PlanLimitResource, (limit: number) => string> = {
  patients: (limit) =>
    `El plan actual permite hasta ${limit} pacientes. Mejora tu plan para agregar más.`,
  fileStorageBytes: (limit) =>
    `El plan actual permite hasta ${megabytes(limit)} de archivos clínicos. Mejora tu plan para subir más.`,
  filesPerPatient: (limit) =>
    `El plan actual permite hasta ${limit} archivos por paciente. Mejora tu plan para subir más.`,
};

/** Mismo cuerpo que el `PLAN_LIMIT_REACHED` de Core: los clientes manejan una sola forma. */
export class PlanLimitReachedException extends ForbiddenException {
  constructor(resource: PlanLimitResource, limit: number) {
    super({
      statusCode: 403,
      error: 'Forbidden',
      code: 'PLAN_LIMIT_REACHED',
      resource,
      limit,
      message: MESSAGES[resource](limit),
    });
  }
}
