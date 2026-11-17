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
const NOW = new Date(2026, 10, 16, 12, 0, 0);

const load = createSourceLoader();
const { toQuickProcedureInput } = load("src/features/clinical-encounter/utils/quick-procedure.ts");
const { applyCreateDefaults, emptyCreateForm } = load(
  "src/features/clinical-encounter/utils/encounter-create-form.ts",
);

function values(overrides = {}) {
  return {
    branchId: "branch-1",
    date: "2026-11-16",
    time: "10:30",
    targetType: "TOOTH",
    toothNumber: "16, 17",
    targetDescription: "",
    description: "  Restauración  ",
    observations: "  Sin complicaciones  ",
    ...overrides,
  };
}

test("Atención rápida: construye el contrato con una fila por pieza", () => {
  const result = toQuickProcedureInput(values(), NOW);
  assert.ok("input" in result);
  assert.equal(result.input.branchId, "branch-1");
  assert.equal(result.input.performedAt, new Date(2026, 10, 16, 10, 30).toISOString());
  assert.equal(result.input.procedureSummary, "Sin complicaciones");
  assert.deepEqual(result.input.procedures, [
    { targetType: "TOOTH", toothNumber: "16", description: "Restauración" },
    { targetType: "TOOTH", toothNumber: "17", description: "Restauración" },
  ]);
  assert.equal("appointmentId" in result.input, false);

  const region = toQuickProcedureInput(
    values({ targetType: "REGION", toothNumber: "", targetDescription: " Cuadrante 1 ", observations: " " }),
    NOW,
  );
  assert.deepEqual(region.input.procedures, [
    { targetType: "REGION", targetDescription: "Cuadrante 1", description: "Restauración" },
  ]);
  assert.equal(region.input.procedureSummary, null);
});

test("Atención rápida: valida sucursal, fecha, pieza y descripción", () => {
  const error = (overrides) => toQuickProcedureInput(values(overrides), NOW).error;
  assert.match(error({ branchId: " " }), /sucursal/);
  assert.match(error({ date: "2026-02-30" }), /fecha y una hora válidas/);
  assert.match(error({ time: "25:00" }), /fecha y una hora válidas/);
  assert.match(error({ date: "2026-11-17" }), /no pueden ser futuras/);
  assert.match(error({ toothNumber: "99" }), /FDI/);
  assert.match(error({ toothNumber: "" }), /pieza dental/);
  assert.match(error({ description: "  " }), /descripción/);
  // La hora actual (con margen de reloj) es válida.
  assert.ok("input" in toQuickProcedureInput(values({ time: "12:00" }), NOW));
});

test("Nueva atención: preselecciona la cita del enlace y la única sucursal", () => {
  const reference = {
    branches: [{ id: "branch-1", label: "Centro" }],
    appointments: [
      { id: "apt-1", label: "16 nov · 10:00" },
      { id: "apt-2", label: "17 nov · 09:00", treatmentId: "treatment-9" },
    ],
  };
  const base = emptyCreateForm();

  const plain = applyCreateDefaults(base, reference);
  assert.equal(plain.branchId, "branch-1");
  assert.equal(plain.appointmentId, "");

  const linked = applyCreateDefaults(base, reference, "apt-2");
  assert.equal(linked.appointmentId, "apt-2");
  assert.equal(linked.treatmentId, "treatment-9");

  // Una cita que ya no está disponible (cancelada o ya atendida) no se preselecciona.
  const gone = applyCreateDefaults(base, reference, "apt-missing");
  assert.equal(gone.appointmentId, "");
  assert.equal(gone.branchId, "branch-1");

  // Con varias sucursales no se elige ninguna por el usuario.
  const many = applyCreateDefaults(base, { ...reference, branches: [...reference.branches, { id: "b2", label: "Sur" }] }, "apt-1");
  assert.equal(many.branchId, "");
  assert.equal(many.appointmentId, "apt-1");

  const page = fs.readFileSync(
    path.join(root, "src/app/(platform)/patients/[patientId]/clinical-encounters/new/page.tsx"),
    "utf8",
  );
  assert.match(page, /requestedAppointmentId=\{typeof appointmentId === "string" \? appointmentId : undefined\}/);
});

test("Atención rápida: el adaptador y el BFF usan la ruta /quick", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url: String(url), method: init.method, body: init.body });
    return Response.json(
      {
        id: "0b9a5c1e-2f6d-4c3b-9a8e-1d2c3b4a5f60", patientId: PATIENT, branchId: "branch-1",
        practitionerMembershipId: "m-1", startedAt: "2026-11-16T14:30:00.000Z", endedAt: "2026-11-16T14:30:00.000Z",
        status: "COMPLETED", appointmentId: null, treatmentId: null, procedureSummary: null, rowVersion: 1,
        procedures: [{ id: "p-1", clinicalEncounterId: "e-1", targetType: "TOOTH", toothNumber: "16", targetDescription: null, description: "Restauración", status: "RECORDED" }],
      },
      { status: 201 },
    );
  });
  const { createClinicalEncounterHttpDataSource } = createSourceLoader()(
    "src/features/clinical-encounter/services/clinical-encounter.http.ts",
  );
  const input = toQuickProcedureInput(values({ toothNumber: "16" }), NOW).input;
  const encounter = await createClinicalEncounterHttpDataSource().registerQuickProcedure(PATIENT, input);
  assert.equal(calls[0].url, `/api/dentistry/patients/${PATIENT}/clinical-encounters/quick`);
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(JSON.parse(calls[0].body), input);
  assert.equal(encounter.status, "COMPLETED");
  assert.equal("appointmentId" in encounter, false);
  assert.equal("targetDescription" in encounter.procedures[0], false);

  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const target = `patients/${PATIENT}/clinical-encounters/quick`;
  const request = (method) =>
    new NextRequest(`${ORIGIN}/api/dentistry/${target}`, {
      method,
      ...(method !== "GET"
        ? { headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify(input) }
        : {}),
    });
  assert.equal((await proxyToDentistry(request("POST"), target.split("/"))).status, 201);
  assert.match(calls.at(-1).url, /\/patients\/[0-9a-f-]+\/clinical-encounters\/quick$/);
  const before = calls.length;
  assert.equal((await proxyToDentistry(request("GET"), target.split("/"))).status, 404);
  assert.equal(calls.length, before);
});

test("Atención rápida: el botón exige permiso y la función del plan", () => {
  const detail = fs.readFileSync(
    path.join(root, "src/features/patient/components/patient-detail-page.tsx"),
    "utf8",
  );
  assert.match(detail, /session\.permissions\.includes\("dentistry:encounters:create"\) &&\s*isModuleEnabled\(session\.plan, "procedures"\)/);
  assert.match(detail, /\{canRegisterProcedure && \(/);
});
