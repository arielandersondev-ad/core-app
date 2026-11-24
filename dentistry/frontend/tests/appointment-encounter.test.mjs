import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server.js";
import { createBffLoader, createSourceLoader } from "./support/load-source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://clinic.test";
const PATIENT = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const APPOINTMENT = "6f1c2b3a-4d5e-4f60-8a7b-9c0d1e2f3a4b";
const NOW = new Date(2026, 10, 16, 12, 0, 0);
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const load = createSourceLoader();
const {
  resolveAppointmentEncounterActions,
  toBackendAppointmentStatus,
  newEncounterHref,
  encounterHref,
} = load("src/features/clinical-encounter/utils/appointment-encounter.ts");
const { toQuickProcedureInput } = load("src/features/clinical-encounter/utils/quick-procedure.ts");

const ALL = ["dentistry:encounters:read", "dentistry:encounters:create"];
const STARTER = { modules: ["patients", "agenda", "appointments", "procedures"], limits: {} };
const none = { state: "ready", encounter: null };
const resolve = (overrides = {}) =>
  resolveAppointmentEncounterActions({
    appointmentStatus: "SCHEDULED",
    permissions: ALL,
    plan: STARTER,
    lookup: none,
    ...overrides,
  });

test("Cita → atención: ofrece Atender y Registrar procedimiento en una cita pendiente", () => {
  for (const status of ["SCHEDULED", "CONFIRMED", "WAITING_ROOM", "IN_PROGRESS", "COMPLETED", "programada", "en_curso", "completada"]) {
    assert.deepEqual(resolve({ appointmentStatus: status }), {
      kind: "available",
      canAttend: true,
      canRegisterProcedure: true,
    }, status);
  }
});

test("Cita → atención: no se atiende una cita cancelada o ausente", () => {
  for (const status of ["CANCELED", "NO_SHOW", "cancelada", "no_asistio"]) {
    assert.deepEqual(resolve({ appointmentStatus: status }), { kind: "hidden" }, status);
  }
  assert.equal(toBackendAppointmentStatus("en_sala"), "WAITING_ROOM");
  assert.equal(toBackendAppointmentStatus("CONFIRMED"), "CONFIRMED");
});

test("Cita → atención: con una atención vinculada solo se ofrece verla", () => {
  const existing = resolve({ lookup: { state: "ready", encounter: { id: "enc-1", status: "VOIDED" } } });
  assert.deepEqual(existing, { kind: "existing", encounterId: "enc-1", encounterStatus: "VOIDED", canView: true });
  const noRead = resolve({
    permissions: ["dentistry:encounters:create"],
    lookup: { state: "ready", encounter: { id: "enc-1", status: "IN_PROGRESS" } },
  });
  assert.equal(noRead.canView, false);
  assert.deepEqual(resolve({ lookup: { state: "pending" } }), { kind: "loading" });
});

test("Cita → atención: permisos y funciones del plan", () => {
  assert.deepEqual(resolve({ permissions: ["dentistry:encounters:read"] }), { kind: "hidden" });
  // Sin la función `procedures` solo queda Atender.
  assert.deepEqual(resolve({ plan: { ...STARTER, modules: ["patients"] } }), {
    kind: "available",
    canAttend: true,
    canRegisterProcedure: false,
  });
  // Sin historial clínico en el plan no hay acciones.
  assert.deepEqual(resolve({ plan: { ...STARTER, modules: ["agenda", "procedures"] } }), { kind: "hidden" });
  assert.deepEqual(resolve({ plan: null }), { kind: "hidden" });
  // Plan anterior a las funciones: no restringe.
  assert.equal(resolve({ plan: { modules: null, limits: {} } }).kind, "available");
  // Sin permiso de lectura se ofrecen igual: el backend rechaza el duplicado.
  assert.equal(resolve({ permissions: ["dentistry:encounters:create"], lookup: { state: "unknown" } }).kind, "available");
});

test("Cita → atención: la tarjeta arma la atención rápida con la sucursal de la cita", () => {
  const { toProcedureTarget } = createSourceLoader({
    "@/modules/clinic/hooks": {},
  })("src/modules/clinic/views/agenda/hooks/useAgendaAppointments.ts");
  const apt = { id: APPOINTMENT, patientId: PATIENT, branchId: "branch-1", patientName: "Ana Pérez", startTime: "09:00", endTime: "09:30" };
  assert.deepEqual(toProcedureTarget(apt), {
    patientId: PATIENT,
    appointmentId: APPOINTMENT,
    branchId: "branch-1",
    patientName: "Ana Pérez",
    label: "Ana Pérez · 09:00 – 09:30",
  });
  assert.equal(toProcedureTarget({ ...apt, branchId: undefined }), null);
});

test("Cita → atención: enlaces a la nueva atención y al detalle", () => {
  assert.equal(
    newEncounterHref(PATIENT, APPOINTMENT),
    `/patients/${PATIENT}/clinical-encounters/new?appointmentId=${APPOINTMENT}`,
  );
  assert.equal(encounterHref(PATIENT, "enc 1"), `/patients/${PATIENT}/clinical-encounters/enc%201`);
});

test("Atención rápida desde una cita: envía la cita en el contrato", () => {
  const result = toQuickProcedureInput(
    {
      branchId: "branch-1",
      appointmentId: APPOINTMENT,
      date: "2026-11-16",
      time: "10:30",
      targetType: "TOOTH",
      toothNumber: "38",
      targetDescription: "",
      description: "Exodoncia",
      observations: "",
    },
    NOW,
  );
  assert.equal(result.input.appointmentId, APPOINTMENT);
  assert.equal(result.input.branchId, "branch-1");
});

test("Cita → atención: el adaptador y el BFF consultan la atención por cita", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url: String(url), method: init?.method });
    return Response.json({ items: [], pagination: { page: 1, pageSize: 1, totalItems: 0, totalPages: 0, hasMore: false } });
  });
  const { createClinicalEncounterHttpDataSource } = createSourceLoader()(
    "src/features/clinical-encounter/services/clinical-encounter.http.ts",
  );
  await createClinicalEncounterHttpDataSource().list(PATIENT, { appointmentId: APPOINTMENT, pageSize: 1 });
  assert.equal(
    calls[0].url,
    `/api/dentistry/patients/${PATIENT}/clinical-encounters?appointmentId=${APPOINTMENT}&pageSize=1`,
  );

  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const target = `patients/${PATIENT}/clinical-encounters`;
  const request = (query) => new NextRequest(`${ORIGIN}/api/dentistry/${target}?${query}`);
  assert.equal((await proxyToDentistry(request(`appointmentId=${APPOINTMENT}`), target.split("/"))).status, 200);
  assert.match(calls.at(-1).url, new RegExp(`clinical-encounters\\?appointmentId=${APPOINTMENT}$`));
  const before = calls.length;
  assert.equal((await proxyToDentistry(request("appointment=x"), target.split("/"))).status, 400);
  assert.equal(calls.length, before);
});

test("Cita → atención: las mutaciones refrescan la agenda cuando hay cita", () => {
  const options = read("src/features/clinical-encounter/api/query-options.ts");
  const refreshes = options.match(/\.\.\.\(encounter\.appointmentId \? \[invalidateAppointments\(client\)\] : \[\]\)/g) ?? [];
  // Alta, atención rápida y completar.
  assert.equal(refreshes.length, 3);
  assert.match(options, /export function appointmentEncounterOptions\(patientId: string, appointmentId: string\)/);
});

test("Cita → atención: la agenda monta las acciones en la tarjeta y en el detalle", () => {
  const card = read("src/modules/clinic/views/agenda/AgendaAppointmentCard.tsx");
  assert.match(card, /<AppointmentEncounterActions[\s\S]*?appointmentStatus=\{apt\.status\}/);
  const sheet = read("src/modules/clinic/components/AppointmentDetailSheet.tsx");
  assert.match(sheet, /<AppointmentEncounterActions\s+layout="panel"/);
  // El cambio manual de estado ya no se confunde con la atención clínica.
  assert.doesNotMatch(sheet, /Iniciar atención \(Pasar a sillón\)/);
  const agenda = read("src/modules/clinic/views/Agenda.tsx");
  // Se cierra el detalle y el modal se abre cuando la hoja liberó el historial (móvil).
  assert.match(agenda, /setIsDetailSheetOpen\(false\);[^\n]*procedureFlow\.open\(target, \{ afterSheetClose: true \}\)/);
  assert.match(agenda, /\{procedureFlow\.banner\}/);
  assert.match(agenda, /\{procedureFlow\.modal\}/);
  const flow = read("src/features/clinical-encounter/components/appointment-procedure-flow.tsx");
  assert.match(flow, /appointment=\{\{ id: target\.appointmentId, branchId: target\.branchId, label: target\.label \}\}/);
  assert.match(flow, /const SHEET_HISTORY_SETTLE_MS = 200;/);
});

test("Cita → atención: los botones se adaptan a móvil, tablet y escritorio", () => {
  const actions = read("src/features/clinical-encounter/components/appointment-encounter-actions.tsx");
  // Fila que envuelve: dos botones por línea en tablet/escritorio, apilados a ancho completo en móvil.
  assert.match(actions, /flex flex-wrap items-center gap-2/);
  // Nunca parten la etiqueta en dos líneas; si no caben juntos, se apilan.
  assert.match(actions, /min-w-\[12rem\] flex-1 whitespace-nowrap/);
  // Altura táctil: 40 px en la tarjeta y 48 px en el detalle.
  // En escritorio la tarjeta no estira los botones a todo el ancho.
  assert.match(actions, /layout === "panel" \? "h-12" : "sm:flex-none"/);

  // Nueva atención (destino de "Atender"): en móvil "Crear atención" no se parte en dos líneas.
  const createPage = read("src/features/clinical-encounter/components/clinical-encounter-create-page.tsx");
  assert.match(createPage, /className="flex-1 whitespace-nowrap sm:flex-none"/);
});
