const CIVIL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseDate(value?: string): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const civilMatch = CIVIL_DATE_PATTERN.exec(trimmed);
  if (civilMatch) {
    const year = Number(civilMatch[1]);
    const month = Number(civilMatch[2]);
    const day = Number(civilMatch[3]);
    const date = new Date(year, month - 1, day);
    date.setFullYear(year);

    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Combina una fecha civil (`YYYY-MM-DD`) y una hora (`HH:mm`) en un instante
 * ISO. Devuelve `null` si la fecha o la hora son inválidas; nunca inventa la
 * hora actual de forma silenciosa.
 */
export function buildInstant(date: string, time: string): string | null {
  const dateMatch = CIVIL_DATE_PATTERN.exec(date.trim());
  const timeMatch = TIME_PATTERN.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);

  const parsed = new Date(year, month - 1, day, hours, minutes, 0, 0);
  parsed.setFullYear(year);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hours ||
    parsed.getMinutes() !== minutes
  ) {
    return null;
  }

  return parsed.toISOString();
}

export function formatDateOnly(iso?: string): string {
  const date = parseDate(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
}

export function formatDateTimeShort(iso?: string): string {
  const date = parseDate(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatTimeOnly(iso?: string): string {
  const date = parseDate(iso);
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function durationLabel(startIso: string, endIso?: string): string {
  if (!endIso) return "En curso";

  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return "—";

  const minutes = Math.max(0, Math.round((end - start) / 60000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
}

export function toDateInputValue(iso?: string): string {
  const date = parseDate(iso);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(iso?: string): string {
  const date = parseDate(iso);
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function nowDateValue(): string {
  return toDateInputValue(new Date().toISOString());
}

export function nowTimeValue(): string {
  return toTimeInputValue(new Date().toISOString());
}
