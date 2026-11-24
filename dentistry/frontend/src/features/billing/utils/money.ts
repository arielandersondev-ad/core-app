/** Moneda por defecto de la clínica; el backend la exige de tres letras. */
export const DEFAULT_CURRENCY = "BOB";
/** Tope de importe del backend (`int4`). */
export const MAX_MINOR = 2_147_483_647;

/**
 * Convierte lo que escribe una persona ("200", "200,50", "10 000.5") en
 * unidades menores enteras, sin pasar por decimales binarios. `null` si no es
 * un importe válido (negativo, más de dos decimales o fuera de rango).
 */
export function parseAmountToMinor(text: string): number | null {
  const compact = text.trim().replace(/\s+/g, "");
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(compact);
  if (!match) return null;
  const minor = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || "0");
  return Number.isSafeInteger(minor) && minor <= MAX_MINOR ? minor : null;
}

/** Texto editable de un importe: 20000 → "200", 20050 → "200.50". */
export function minorToInputValue(amountMinor: number): string {
  const whole = Math.trunc(amountMinor / 100);
  const cents = Math.abs(amountMinor % 100);
  return cents === 0 ? String(whole) : `${whole}.${String(cents).padStart(2, "0")}`;
}

export function normalizeCurrency(value: string): string | null {
  const upper = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(upper) ? upper : null;
}
