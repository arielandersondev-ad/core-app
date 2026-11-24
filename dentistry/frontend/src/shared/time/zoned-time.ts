/**
 * Fechas de calendario en la zona horaria de la sucursal (u organización).
 *
 * La API guarda instantes; aquí se convierten a la "hora de pared" que ve la
 * clínica, sin depender de la zona configurada en el navegador.
 */

const CIVIL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidTimeZone(timeZone: string | null | undefined): timeZone is string {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

type WallParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

/** Componentes de calendario del instante en la zona. */
export function wallPartsIn(instant: Date, timeZone: string): WallParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

function offsetMs(instant: number, timeZone: string): number {
  const p = wallPartsIn(new Date(instant), timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * Instante ISO de una fecha (`YYYY-MM-DD`) y hora (`HH:mm`) de pared en la
 * zona. `null` si la fecha o la hora no existen.
 */
export function wallTimeToInstant(date: string, time: string, timeZone: string): string | null {
  const d = CIVIL_DATE.exec(date.trim());
  const t = TIME.exec(time.trim());
  if (!d || !t) return null;
  const [year, month, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const wallClock = Date.UTC(year, month - 1, day, Number(t[1]), Number(t[2]));
  const check = new Date(wallClock);
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }
  // Se recalcula el desfase en el instante obtenido para respetar cambios de horario.
  let instant = wallClock - offsetMs(wallClock, timeZone);
  instant = wallClock - offsetMs(instant, timeZone);
  return new Date(instant).toISOString();
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** `YYYY-MM-DD` del instante en la zona; "" si no es válido. */
export function civilDateIn(value: string | Date, timeZone: string): string {
  const date = toDate(value);
  if (!date) return "";
  const p = wallPartsIn(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** `HH:mm` (24 h) del instante en la zona; "" si no es válido. */
export function timeIn(value: string | Date, timeZone: string): string {
  const date = toDate(value);
  if (!date) return "";
  const p = wallPartsIn(date, timeZone);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** Minutos desde la medianoche de la zona. */
export function minutesOfDayIn(value: string | Date, timeZone: string): number {
  const date = toDate(value);
  if (!date) return 0;
  const p = wallPartsIn(date, timeZone);
  return p.hour * 60 + p.minute;
}

export function todayIn(timeZone: string, now: Date = new Date()): string {
  return civilDateIn(now, timeZone);
}

/** Formatea el instante en la zona con `Intl.DateTimeFormat`. */
export function formatInZone(
  value: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
  locale = "es-BO",
): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
}
