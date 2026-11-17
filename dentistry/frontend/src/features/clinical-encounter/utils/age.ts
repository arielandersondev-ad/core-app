/**
 * Calcula la edad a partir de una fecha civil (`YYYY-MM-DD`) comparando
 * componentes locales. No construye instantes UTC, así que no hay desfase de
 * zona horaria.
 */
export function computeAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const birth = new Date(year, month - 1, day);
  birth.setFullYear(year);

  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}
