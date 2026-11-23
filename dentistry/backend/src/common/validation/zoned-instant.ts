import { BadRequestException } from '@nestjs/common';
import { hasExplicitOffset, parseInstantIn } from '../time/zoned-time.js';

/** true si alguna de las fechas/horas llega sin zona y hay que resolverla. */
export function needsTimeZone(...values: (string | null | undefined)[]): boolean {
  return values.some((value) => typeof value === 'string' && !hasExplicitOffset(value.trim()));
}

/**
 * Instante de una fecha/hora del body. Sin `Z` ni `±hh:mm` se interpreta como
 * hora de pared en `timeZone` (la de la sucursal o, en su defecto, la de la
 * organización).
 */
export function parseZonedInstant(value: string, timeZone: string, fieldName: string): Date {
  const instant = parseInstantIn(value, timeZone);
  if (!instant) {
    throw new BadRequestException(`${fieldName} no es una fecha y hora válida`);
  }
  return instant;
}
