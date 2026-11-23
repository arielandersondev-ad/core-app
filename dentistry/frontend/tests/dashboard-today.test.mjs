import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();
const { toTodayAgenda, summarizeToday, greetingAt, APPOINTMENT_STATUS_LABELS } = load(
  "src/features/dashboard/utils/today-agenda.ts",
);

const appointment = (overrides) => ({
  id: "a",
  organizationId: "org",
  branchId: "branch-lp",
  patientId: "p",
  scheduledStartAt: "2026-11-23T14:00:00.000Z",
  scheduledEndAt: "2026-11-23T14:30:00.000Z",
  status: "SCHEDULED",
  createdByMembershipId: "m",
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: "2026-11-20T00:00:00.000Z",
  ...overrides,
});

test("agenda de hoy: sin canceladas, ordenada y en la hora de cada sucursal", () => {
  const zones = { "branch-lp": "America/La_Paz", "branch-lima": "America/Lima" };
  const rows = toTodayAgenda(
    [
      appointment({ id: "late", scheduledStartAt: "2026-11-23T20:00:00.000Z", scheduledEndAt: "2026-11-23T21:00:00.000Z", patientName: "Ana Rojas", serviceName: "Limpieza" }),
      appointment({ id: "canceled", status: "CANCELED", patientName: "No debe salir" }),
      appointment({
        id: "early", branchId: "branch-lima", personName: "Luis Paz", status: "IN_PROGRESS",
        services: [{ serviceId: "s1", serviceName: "Resina" }, { serviceId: "s2", serviceName: "Profilaxis" }],
      }),
      appointment({ id: "anonymous", scheduledStartAt: "2026-11-23T15:00:00.000Z", status: "COMPLETED" }),
    ],
    (branchId) => zones[branchId],
  );

  assert.deepEqual(rows.map((row) => row.id), ["early", "anonymous", "late"]);
  assert.deepEqual(rows[0], {
    id: "early", startTime: "09:00", endTime: "09:30", patientName: "Luis Paz",
    serviceLabel: "Resina +1", status: "IN_PROGRESS",
  });
  assert.equal(rows[1].patientName, "Paciente sin nombre");
  assert.equal(rows[1].serviceLabel, null);
  assert.equal(rows[2].startTime, "16:00");
  assert.equal(rows[2].serviceLabel, "Limpieza");
  assert.deepEqual(summarizeToday(rows), { total: 3, completed: 1, inProgress: 1 });
});

test("saludo según la hora de la organización y etiquetas de estado completas", () => {
  assert.equal(greetingAt(new Date("2026-11-23T13:00:00.000Z"), "America/La_Paz"), "Buenos días");
  assert.equal(greetingAt(new Date("2026-11-23T18:00:00.000Z"), "America/La_Paz"), "Buenas tardes");
  assert.equal(greetingAt(new Date("2026-11-24T00:30:00.000Z"), "America/La_Paz"), "Buenas noches");
  for (const status of ["SCHEDULED", "CONFIRMED", "WAITING_ROOM", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELED"]) {
    assert.ok(APPOINTMENT_STATUS_LABELS[status], status);
  }
});
