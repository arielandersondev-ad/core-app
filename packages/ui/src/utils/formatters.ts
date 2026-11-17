import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import relativeTime from "dayjs/plugin/relativeTime.js";
import duration from "dayjs/plugin/duration.js";
import "dayjs/locale/es.js";

// Configuración global de Day.js con plugins estándar
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale("es");

export { dayjs };

// ── 1. UTILIDADES ESTÁNDAR PARA FECHAS ────────────────────────────────────────

export type CivilDateFormat = "full" | "medium" | "short" | "iso" | "monthYear";

/**
 * Formatea una fecha civil (YYYY-MM-DD o Date) de forma determinista,
 * evitando desfases de huso horario causados por parseos UTC a medianoche.
 *
 * @example
 * formatCivilDate("2026-10-28", "full") => "miércoles, 28 de octubre de 2026"
 * formatCivilDate("2026-10-28", "medium") => "28 de oct. de 2026"
 * formatCivilDate("2026-10-28", "short") => "28/10/2026"
 */
export function formatCivilDate(
  dateValue?: string | Date | null,
  format: CivilDateFormat = "medium",
): string {
  if (!dateValue) return "";

  let d: dayjs.Dayjs;
  if (typeof dateValue === "string") {
    // Si viene solo como fecha civil YYYY-MM-DD, parsear con formato estricto
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      d = dayjs(dateValue, "YYYY-MM-DD");
    } else {
      d = dayjs(dateValue);
    }
  } else {
    d = dayjs(dateValue);
  }

  if (!d.isValid()) return String(dateValue);

  switch (format) {
    case "full":
      return d.format("dddd, D [de] MMMM [de] YYYY");
    case "medium":
      return d.format("D [de] MMM. [de] YYYY");
    case "short":
      return d.format("DD/MM/YYYY");
    case "iso":
      return d.format("YYYY-MM-DD");
    case "monthYear":
      return d.format("MMMM [de] YYYY");
    default:
      return d.format("D [de] MMMM [de] YYYY");
  }
}

/**
 * Formatea un instante temporal (ISO 8601 con hora y fecha).
 *
 * @example
 * formatDateTime("2026-10-28T09:30:00Z") => "28/10/2026, 09:30"
 */
export function formatDateTime(
  instant?: string | Date | null,
  formatPattern: string = "DD/MM/YYYY, HH:mm",
): string {
  if (!instant) return "";
  const d = dayjs(instant);
  if (!d.isValid()) return String(instant);
  return d.format(formatPattern);
}

/**
 * Retorna la representación relativa en tiempo humano ("hace 5 minutos", "en 2 horas").
 */
export function formatRelativeTime(instant: string | Date): string {
  const d = dayjs(instant);
  if (!d.isValid()) return "";
  return d.fromNow();
}

/**
 * Calcula la edad precisa en años a partir de una fecha de nacimiento civil.
 */
export function calcAgeFromBirthDate(birthDateStr?: string | null): number {
  if (!birthDateStr) return 0;
  const birth = dayjs(birthDateStr, "YYYY-MM-DD");
  if (!birth.isValid()) return 0;
  return dayjs().diff(birth, "year");
}

// ── 2. UTILIDADES ESTÁNDAR PARA HORAS ─────────────────────────────────────────

/**
 * Formatea una hora en formato estándar "HH:mm".
 *
 * @example
 * formatTime("2026-10-28T09:30:00Z") => "09:30"
 * formatTime("09:30:00") => "09:30"
 */
export function formatTime(timeValue?: string | Date | null, isUtc?: boolean): string {
  if (!timeValue) return "";

  if (typeof timeValue === "string") {
    // Si ya viene como "HH:mm" o "HH:mm:ss"
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeValue)) {
      const [h, m] = timeValue.split(":");
      return `${h.padStart(2, "0")}:${m}`;
    }
  }

  const d = isUtc ? dayjs.utc(timeValue) : dayjs(timeValue);
  if (!d.isValid()) return String(timeValue);
  return d.format("HH:mm");
}

/**
 * Formatea un rango de horario con guión medio estilizado.
 *
 * @example
 * formatTimeRange("09:00", "09:45") => "09:00 – 09:45"
 */
export function formatTimeRange(
  startTime?: string | Date | null,
  endTime?: string | Date | null,
): string {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (!start && !end) return "";
  if (start && !end) return start;
  if (!start && end) return end;
  return `${start} – ${end}`;
}

/**
 * Convierte un string de hora "HH:mm" a minutos acumulados del día.
 *
 * @example
 * timeToMinutes("09:30") => 570
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  if (parts.length < 2) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Convierte minutos acumulados a string de hora "HH:mm".
 *
 * @example
 * minutesToTime(570) => "09:30"
 */
export function minutesToTime(minutes: number): string {
  const safe = Math.max(0, Math.floor(minutes));
  const h = Math.floor(safe / 60) % 24;
  const m = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Suma una cantidad de minutos a una fecha u hora ISO y devuelve la nueva fecha en ISO.
 *
 * @example
 * addMinutesToIso("2026-10-28T09:00:00.000Z", 45) => "2026-10-28T09:45:00.000Z"
 */
export function addMinutesToIso(startIso: string, minutes: number): string {
  const d = dayjs(startIso);
  if (!d.isValid()) return startIso;
  return d.add(minutes, "minute").toISOString();
}

// ── 3. UTILIDADES ESTÁNDAR PARA MONEDAS (INTL.NUMBERFORMAT) ───────────────────

export interface CurrencyFormatOptions {
  /**
   * Código ISO 4217 de la moneda. Por defecto: "BOB" (Bolivianos).
   * Ejemplos soportados: "BOB", "USD", "CLP", "COP", "EUR".
   */
  currency?: string;
  /**
   * Locale de formateo regional. Por defecto: "es-BO".
   */
  locale?: string;
  /**
   * Si es true, el valor se interpreta en unidades menores (centavos) y se divide entre 100.
   * Alineado al contrato de persistencia del monorepo (`amountMinor`).
   */
  isMinorUnit?: boolean;
  /**
   * Mínimo de decimales a mostrar (por defecto 2).
   */
  minimumFractionDigits?: number;
  /**
   * Máximo de decimales a mostrar (por defecto 2).
   */
  maximumFractionDigits?: number;
}

const formatterCache = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(locale: string, currency: string, minDec = 2, maxDec = 2): Intl.NumberFormat {
  const key = `${locale}-${currency}-${minDec}-${maxDec}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: minDec,
        maximumFractionDigits: maxDec,
      });
    } catch {
      // Fallback seguro si el locale o la moneda son desconocidos
      formatter = new Intl.NumberFormat("es-BO", {
        style: "currency",
        currency: "BOB",
        minimumFractionDigits: minDec,
        maximumFractionDigits: maxDec,
      });
    }
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/**
 * Formatea un importe numérico según el estándar internacional `Intl.NumberFormat`.
 *
 * @example
 * formatCurrency(150) => "Bs 150,00" (o "Bs. 150.00" según locale)
 * formatCurrency(150, { currency: "USD" }) => "$ 150.00"
 * formatCurrency(15000, { isMinorUnit: true }) => "Bs 150,00"
 */
export function formatCurrency(
  amount?: number | null,
  options: CurrencyFormatOptions = {},
): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) {
    return formatCurrency(0, options);
  }

  const {
    currency = "BOB",
    locale = "es-BO",
    isMinorUnit = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const valueToFormat = isMinorUnit ? amount / 100 : amount;
  const formatter = getNumberFormatter(locale, currency, minimumFractionDigits, maximumFractionDigits);

  return formatter.format(valueToFormat);
}

/**
 * Formatea un valor proveniente directamente de la base de datos expresado en unidades menores (Minor Units / centavos).
 *
 * @example
 * formatMinorCurrency(26000) => "Bs 260,00"
 */
export function formatMinorCurrency(amountMinor?: number | null, currency: string = "BOB"): string {
  return formatCurrency(amountMinor, { currency, isMinorUnit: true });
}

/**
 * Convierte un importe decimal en unidades principales a unidades menores enteras para la BD.
 *
 * @example
 * toMinorUnits(150.50) => 15050
 */
export function toMinorUnits(amount: number): number {
  if (Number.isNaN(amount)) return 0;
  return Math.round(amount * 100);
}

/**
 * Convierte unidades menores (enteros de la BD) a decimal para operaciones numéricas.
 *
 * @example
 * fromMinorUnits(15050) => 150.50
 */
export function fromMinorUnits(amountMinor: number): number {
  if (Number.isNaN(amountMinor)) return 0;
  return amountMinor / 100;
}
