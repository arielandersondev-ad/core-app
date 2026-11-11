import { BadRequestException } from '@nestjs/common';

/** The PostgreSQL date codec uses UTC-midnight Date objects for civil dates. */
export function parseCivilDate(
  value: string | null | undefined,
  fieldName = 'birthDate',
): Date | null | undefined {
  if (value === undefined || value === null) return value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException(`${fieldName} debe tener el formato YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException(`${fieldName} no es una fecha válida`);
  }
  return date;
}

/**
 * Instante en que empieza la fecha civil (UTC-midnight Date de `parseCivilDate`)
 * en la zona horaria IANA indicada. Se recalcula el desfase en el instante
 * resultante para respetar cambios de horario.
 */
export function startOfCivilDateIn(civilDate: Date, timeZone: string): Date {
  const wallClock = civilDate.getTime();
  let instant = wallClock - timeZoneOffsetMs(wallClock, timeZone);
  instant = wallClock - timeZoneOffsetMs(instant, timeZone);
  return new Date(instant);
}

function timeZoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second'),
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}
