/**
 * Conversión entre instantes y la hora de pared de una zona horaria IANA.
 *
 * La base guarda instantes (`timestamptz`); la zona solo interviene al leer o
 * escribir fecha/hora "de calendario" (la que ve la recepción de la sucursal).
 */

const CIVIL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const NAIVE_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;
const EXPLICIT_OFFSET = /(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/;

export const DEFAULT_TIME_ZONE = 'UTC';

/** true si la cadena ISO trae `Z` o `±hh:mm`, es decir, ya es un instante. */
export function hasExplicitOffset(value: string): boolean {
  return /T|\s/.test(value) && EXPLICIT_OFFSET.test(value.trim());
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone });
    return true;
  } catch {
    return false;
  }
}

/** Primera zona válida de la lista; `UTC` si ninguna lo es. */
export function pickTimeZone(...candidates: (string | null | undefined)[]): string {
  return candidates.find(isValidTimeZone) ?? DEFAULT_TIME_ZONE;
}

/** Desfase (ms) de la zona respecto de UTC en ese instante. */
export function timeZoneOffsetMs(instant: number, timeZone: string): number {
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

/**
 * Instante de una hora de pared (componentes UTC de `wallClockMs`) en la zona.
 * El desfase se recalcula en el instante resultante para respetar cambios de
 * horario.
 */
function wallClockToInstant(wallClockMs: number, timeZone: string): Date {
  let instant = wallClockMs - timeZoneOffsetMs(wallClockMs, timeZone);
  instant = wallClockMs - timeZoneOffsetMs(instant, timeZone);
  return new Date(instant);
}

/**
 * Interpreta una fecha/hora ISO. Con `Z` u `±hh:mm` es un instante; sin zona
 * (`2026-11-22T09:00`) se toma como hora de pared en `timeZone`. Devuelve
 * `null` si la cadena no es válida.
 */
export function parseInstantIn(value: string, timeZone: string): Date | null {
  const trimmed = value.trim();
  if (hasExplicitOffset(trimmed)) {
    const instant = new Date(trimmed);
    return Number.isNaN(instant.getTime()) ? null : instant;
  }
  const match = NAIVE_DATE_TIME.exec(trimmed);
  if (!match) return null;
  const [year, month, day, hour, minute, second = 0] = match
    .slice(1, 7)
    .map((part) => (part === undefined ? undefined : Number(part))) as number[];
  const millis = match[7] ? Number(match[7].slice(0, 3).padEnd(3, '0')) : 0;
  const wallClock = Date.UTC(year, month - 1, day, hour, minute, second, millis);
  const check = new Date(wallClock);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return null;
  }
  return wallClockToInstant(wallClock, timeZone);
}

/** Inicio (inclusive) del día civil `YYYY-MM-DD` en la zona. */
export function startOfDayIn(civilDate: string, timeZone: string): Date | null {
  const match = CIVIL_DATE.exec(civilDate);
  if (!match) return null;
  return parseInstantIn(`${civilDate}T00:00:00`, timeZone);
}

/** Fin (inclusive, último milisegundo) del día civil `YYYY-MM-DD` en la zona. */
export function endOfDayIn(civilDate: string, timeZone: string): Date | null {
  const start = startOfDayIn(civilDate, timeZone);
  if (!start) return null;
  const [year, month, day] = civilDate.split('-').map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1))
    .toISOString()
    .slice(0, 10);
  const next = startOfDayIn(nextDay, timeZone);
  return next ? new Date(next.getTime() - 1) : null;
}

/** Fecha civil `YYYY-MM-DD` del instante en la zona. */
export function civilDateIn(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}
