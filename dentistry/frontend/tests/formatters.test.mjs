import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCivilDate,
  formatDateTime,
  formatTime,
  formatTimeRange,
  timeToMinutes,
  minutesToTime,
  addMinutesToIso,
  formatCurrency,
  formatMinorCurrency,
  toMinorUnits,
  fromMinorUnits,
  calcAgeFromBirthDate,
} from "../../../packages/ui/src/utils/formatters.ts";

test("Formatters: formatCivilDate formatea fechas YYYY-MM-DD sin desfase de zona horaria", () => {
  const civil = "2026-10-28";

  const full = formatCivilDate(civil, "full");
  assert.ok(full.includes("28"), "Debe incluir el día 28");
  assert.ok(full.toLowerCase().includes("octubre"), "Debe incluir el mes octubre");
  assert.ok(full.includes("2026"), "Debe incluir el año 2026");

  const short = formatCivilDate(civil, "short");
  assert.equal(short, "28/10/2026");

  const iso = formatCivilDate(civil, "iso");
  assert.equal(iso, "2026-10-28");
});

test("Formatters: Horas, rangos y sumas de minutos", () => {
  assert.equal(formatTime("09:30"), "09:30");
  assert.equal(formatTime("09:30:00"), "09:30");
  assert.equal(formatTime("2026-10-28T09:30:00.000Z", true), "09:30");

  const range = formatTimeRange("09:00", "09:45");
  assert.equal(range, "09:00 – 09:45");

  assert.equal(timeToMinutes("09:30"), 570);
  assert.equal(minutesToTime(570), "09:30");

  const endIso = addMinutesToIso("2026-10-28T09:00:00.000Z", 45);
  assert.equal(endIso, "2026-10-28T09:45:00.000Z");
});

test("Formatters: Monedas con Intl.NumberFormat y Minor Units", () => {
  // Bolivianos por defecto
  const formattedBob = formatCurrency(150);
  assert.ok(formattedBob.includes("150"), "Debe contener el importe 150");

  // Minor Units (centavos de la BD)
  const formattedMinor = formatMinorCurrency(15000, "BOB");
  assert.ok(formattedMinor.includes("150"), "15000 centavos debe formatearse como 150");

  // Conversiones bidireccionales enteras
  assert.equal(toMinorUnits(150.5), 15050);
  assert.equal(fromMinorUnits(15050), 150.5);
  assert.equal(toMinorUnits(0), 0);
  assert.equal(fromMinorUnits(0), 0);
});

test("Formatters: Cálculo determinista de edad", () => {
  const age = calcAgeFromBirthDate("1995-05-15");
  assert.ok(age >= 30, `La edad debe ser mayor o igual a 30 años (calculado: ${age})`);
});
