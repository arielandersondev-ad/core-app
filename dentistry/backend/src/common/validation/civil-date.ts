import { BadRequestException } from '@nestjs/common';

/** The PostgreSQL date codec uses UTC-midnight Date objects for civil dates. */
export function parseCivilDate(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined || value === null) return value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('birthDate debe tener el formato YYYY-MM-DD');
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException('birthDate no es una fecha válida');
  }
  return date;
}
