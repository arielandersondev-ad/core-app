import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const {
  civilDateIn,
  minutesOfDayIn,
  timeIn,
  todayIn,
  wallTimeToInstant,
} = load("src/shared/time/zoned-time.ts");

const LA_PAZ = "America/La_Paz"; // UTC-4
const LIMA = "America/Lima"; // UTC-5

test("Zona horaria: la hora de pared de la sucursal se convierte al instante correcto", () => {
  assert.equal(wallTimeToInstant("2026-11-22", "09:00", LA_PAZ), "2026-11-22T13:00:00.000Z");
  assert.equal(wallTimeToInstant("2026-11-22", "09:00", LIMA), "2026-11-22T14:00:00.000Z");
  assert.equal(wallTimeToInstant("2026-11-22", "21:30", LA_PAZ), "2026-11-23T01:30:00.000Z");
  // Cambio de horario: Santiago es UTC-3 en verano y UTC-4 en invierno.
  assert.equal(wallTimeToInstant("2026-12-15", "09:00", "America/Santiago"), "2026-12-15T12:00:00.000Z");
  assert.equal(wallTimeToInstant("2026-06-15", "09:00", "America/Santiago"), "2026-06-15T13:00:00.000Z");
  assert.equal(wallTimeToInstant("2026-02-30", "09:00", LA_PAZ), null);
  assert.equal(wallTimeToInstant("2026-11-22", "24:00", LA_PAZ), null);
});

test("Zona horaria: fecha, hora y 'hoy' se leen en la zona, no en UTC ni en el navegador", () => {
  const lateNight = "2026-11-23T01:30:00.000Z"; // 21:30 del 22 en La Paz
  assert.equal(civilDateIn(lateNight, LA_PAZ), "2026-11-22");
  assert.equal(timeIn(lateNight, LA_PAZ), "21:30");
  assert.equal(minutesOfDayIn(lateNight, LA_PAZ), 21 * 60 + 30);
  assert.equal(todayIn(LA_PAZ, new Date(lateNight)), "2026-11-22");
  assert.equal(todayIn("UTC", new Date(lateNight)), "2026-11-23");
  assert.equal(civilDateIn("no-es-fecha", LA_PAZ), "");
});

test("Zona horaria: la sucursal manda; luego la organización; luego el navegador", () => {
  const { resolveTimeZone } = createSourceLoader({
    "@/infrastructure/auth/authenticated-session": { useAuthenticatedSession: () => null },
  })("src/shared/time/use-time-zone.ts");
  const session = { context: { timeZone: LA_PAZ, branchTimeZones: { lima: LIMA, rota: "Marte/Olympus" } } };
  assert.equal(resolveTimeZone(session, "lima"), LIMA);
  assert.equal(resolveTimeZone(session, "rota"), LA_PAZ);
  assert.equal(resolveTimeZone(session, undefined), LA_PAZ);
  const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
  assert.equal(resolveTimeZone({ context: {} }, "lima"), browser);
});

test("Zona horaria: la agenda ubica cada cita en el día y la hora de su sucursal", () => {
  const { mapDtoToAppointment, isAppointmentOverdue } = createSourceLoader({
    "@/modules/clinic/hooks": {},
  })("src/modules/clinic/views/agenda/hooks/useAgendaAppointments.ts");
  const dto = {
    id: "apt-1",
    branchId: "b1",
    patientId: "p1",
    status: "SCHEDULED",
    scheduledStartAt: "2026-11-23T01:30:00.000Z",
    scheduledEndAt: "2026-11-23T02:00:00.000Z",
  };
  const apt = mapDtoToAppointment(dto, LA_PAZ);
  assert.equal(apt.date, "2026-11-22");
  assert.equal(apt.startTime, "21:30");
  assert.equal(apt.endTime, "22:00");
  assert.equal(apt.timeZone, LA_PAZ);

  // A las 21:45 de La Paz (01:45Z del 23) la cita aún no venció; a las 22:00 sí.
  assert.equal(isAppointmentOverdue(apt, "ignorado", 0, new Date("2026-11-23T01:45:00Z")), false);
  assert.equal(isAppointmentOverdue(apt, "ignorado", 0, new Date("2026-11-23T02:00:00Z")), true);
});

test("Zona horaria: atenciones y atención rápida usan la zona de la sucursal", () => {
  const { buildInstant, toDateInputValue, toTimeInputValue, formatTimeOnly } = load(
    "src/features/clinical-encounter/utils/dates.ts",
  );
  assert.equal(buildInstant("2026-11-22", "09:00", LIMA), "2026-11-22T14:00:00.000Z");
  assert.equal(toDateInputValue("2026-11-23T01:30:00.000Z", LA_PAZ), "2026-11-22");
  assert.equal(toTimeInputValue("2026-11-23T01:30:00.000Z", LA_PAZ), "21:30");
  assert.match(formatTimeOnly("2026-11-23T01:30:00.000Z", LA_PAZ), /21:30/);

  const { toQuickProcedureInput } = load("src/features/clinical-encounter/utils/quick-procedure.ts");
  const result = toQuickProcedureInput(
    {
      branchId: "b1",
      date: "2026-11-22",
      time: "09:00",
      targetType: "GENERAL",
      toothNumber: "",
      targetDescription: "",
      description: "Control",
      observations: "",
    },
    new Date("2026-11-22T18:00:00Z"),
    LA_PAZ,
  );
  assert.equal(result.input.performedAt, "2026-11-22T13:00:00.000Z");
});

test("Zona horaria: ninguna pantalla de citas arma instantes pegando 'Z' a la hora local", () => {
  for (const file of [
    "src/modules/clinic/components/CreateAppointmentModal.tsx",
    "src/modules/clinic/views/CreateAppointment.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /:00\.000Z`/, `${file} no debe tratar la hora local como UTC`);
    assert.match(source, /wallTimeToInstant\(/, `${file} debe convertir con la zona de la sucursal`);
  }
  const hook = read("src/modules/clinic/views/agenda/hooks/useAgendaAppointments.ts");
  assert.doesNotMatch(hook, /toISOString\(\)\.slice\(0, 10\)\s*;\s*\n\s*const nowMinutes/);
  assert.doesNotMatch(hook, /scheduledStartAt\.slice\(0, 10\)/);
});
