import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createSourceLoader } from "./support/load-source.mjs";

const { addDaysIso, weekStartOf, weekDaysOf, countActiveByDate } = createSourceLoader()(
  "src/modules/clinic/views/agenda/week.ts",
);

test("la semana va de lunes a domingo", () => {
  // 2026-11-24 es martes.
  assert.equal(weekStartOf("2026-11-24"), "2026-11-23");
  assert.equal(weekStartOf("2026-11-23"), "2026-11-23", "el lunes es su propio inicio");
  assert.equal(weekStartOf("2026-11-29"), "2026-11-23", "el domingo cierra la semana del lunes 23");
  assert.deepEqual(weekDaysOf("2026-11-26"), [
    "2026-11-23",
    "2026-11-24",
    "2026-11-25",
    "2026-11-26",
    "2026-11-27",
    "2026-11-28",
    "2026-11-29",
  ]);
});

test("moverse dentro de la semana no la cambia y cruzar el domingo pasa a la siguiente", () => {
  const week = weekDaysOf("2026-11-25");
  for (const day of week) assert.deepEqual(weekDaysOf(day), week, `${day} muestra la misma semana`);
  const next = addDaysIso("2026-11-29", 1);
  assert.equal(next, "2026-11-30");
  assert.equal(weekStartOf(next), "2026-11-30");
  assert.equal(addDaysIso("2026-11-30", -1), "2026-11-29");
});

test("la aritmética de fechas cruza meses, años y bisiestos", () => {
  assert.equal(addDaysIso("2026-11-30", 1), "2026-12-01");
  assert.equal(addDaysIso("2026-12-31", 1), "2027-01-01");
  assert.equal(addDaysIso("2027-01-01", -1), "2026-12-31");
  assert.equal(addDaysIso("2028-02-28", 1), "2028-02-29");
  assert.equal(addDaysIso("2027-02-28", 1), "2027-03-01");
});

test("cada día cuenta sus citas y las canceladas no cuentan", () => {
  const counts = countActiveByDate([
    { date: "2026-11-24", status: "programada" },
    { date: "2026-11-24", status: "confirmada" },
    { date: "2026-11-24", status: "cancelada" },
    { date: "2026-11-25", status: "cancelada" },
    { date: "2026-11-26", status: "no_asistio" },
  ]);
  assert.deepEqual(counts, { "2026-11-24": 2, "2026-11-26": 1 });
  assert.equal(counts["2026-11-25"], undefined, "un día solo con canceladas queda sin badge");
  assert.deepEqual(countActiveByDate([]), {});
});

test("la cabecera avanza de a un día, no de a una semana, y marca los días con citas", () => {
  const header = fs.readFileSync("src/modules/clinic/views/agenda/AgendaHeader.tsx", "utf8");
  assert.match(header, /onDateChange\(addDaysIso\(date, -1\)\)/);
  assert.match(header, /onDateChange\(addDaysIso\(date, 1\)\)/);
  assert.doesNotMatch(header, /addDays\w*\(date, -?7\)/, "ya no salta de 7 en 7");
  assert.doesNotMatch(header, /Semana (anterior|siguiente)/);
  assert.match(header, /weekDaysOf\(date\)/);
  assert.match(header, /wd\.count > 0 &&/, "el badge solo aparece con al menos una cita");

  const view = fs.readFileSync("src/modules/clinic/views/Agenda.tsx", "utf8");
  assert.match(view, /dayCounts=\{agenda\.weekCounts\}/);
});

test("el badge del día es solo un indicador, sin número", () => {
  const header = fs.readFileSync("src/modules/clinic/views/agenda/AgendaHeader.tsx", "utf8");
  const start = header.indexOf('data-testid="agenda-day-badge"');
  const badge = header.slice(start, header.indexOf("/>", start));
  assert.ok(start > 0, "existe el badge");
  assert.doesNotMatch(badge, /wd\.count/, "el badge no muestra la cantidad");
  assert.doesNotMatch(header, /9\+/);
  assert.match(header, /aria-label=\{`\$\{wd\.longLabel\}.*wd\.count/s, "la cantidad queda en la etiqueta accesible");
});
