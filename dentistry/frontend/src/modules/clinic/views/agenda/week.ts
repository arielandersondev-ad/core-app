/** Fechas civiles `YYYY-MM-DD`. La aritmética es en UTC: no depende del horario de verano. */

function toUtc(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDaysIso(iso: string, days: number): string {
  const date = toUtc(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Lunes de la semana que contiene `iso` (la semana va de lunes a domingo). */
export function weekStartOf(iso: string): string {
  const dayOfWeek = toUtc(iso).getUTCDay(); // 0 = domingo
  return addDaysIso(iso, -((dayOfWeek + 6) % 7));
}

/** Los siete días de la semana de `iso`, de lunes a domingo. */
export function weekDaysOf(iso: string): string[] {
  const start = weekStartOf(iso);
  return Array.from({ length: 7 }, (_, index) => addDaysIso(start, index));
}

/** Citas por día; las canceladas no ocupan agenda y no cuentan. */
export function countActiveByDate(appointments: readonly { date: string; status: string }[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const appointment of appointments) {
    if (appointment.status === "cancelada") continue;
    counts[appointment.date] = (counts[appointment.date] ?? 0) + 1;
  }
  return counts;
}
