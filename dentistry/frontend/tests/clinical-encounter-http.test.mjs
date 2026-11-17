import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { createBffLoader, createSourceLoader } from "./support/load-source.mjs";

const ORIGIN = "https://clinic.test";
const PATIENT = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const ENCOUNTER = "0b9a5c1e-2f6d-4c3b-9a8e-1d2c3b4a5f60";

const encounterDto = {
  id: ENCOUNTER,
  patientId: PATIENT,
  branchId: "branch-1",
  branchName: null,
  practitionerMembershipId: "membership-1",
  practitionerName: "Dra. Prueba",
  startedAt: "2026-11-11T14:00:00.000Z",
  endedAt: null,
  chiefComplaint: "Dolor",
  examinationSummary: null,
  diagnosisSummary: null,
  procedureSummary: null,
  progressNotes: null,
  patientInstructions: null,
  notes: null,
  status: "IN_PROGRESS",
  appointmentId: null,
  treatmentId: null,
  completedAt: null,
  completedByMembershipId: null,
  completedByName: null,
  voidedAt: null,
  voidedByMembershipId: null,
  voidReason: null,
  rowVersion: 1,
  procedures: [
    {
      id: "procedure-1",
      clinicalEncounterId: ENCOUNTER,
      targetType: "WHOLE_MOUTH",
      toothNumber: null,
      targetDescription: null,
      description: "Profilaxis",
      treatmentProcedureId: null,
      status: "RECORDED",
      voidedAt: null,
      voidedByMembershipId: null,
      voidReason: null,
    },
  ],
};

function loadSource(t, respond) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : undefined });
    return respond(url, init);
  });
  const load = createSourceLoader();
  const { createClinicalEncounterHttpDataSource } = load(
    "src/features/clinical-encounter/services/clinical-encounter.http.ts",
  );
  return { source: createClinicalEncounterHttpDataSource(), calls, load };
}

test("HTTP adapter: listado con envelope, filtros y normalización de nulls", async (t) => {
  const { source, calls } = loadSource(t, () =>
    Response.json({ items: [encounterDto], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } }),
  );
  const result = await source.list(PATIENT, { status: "IN_PROGRESS", search: "dolor leve" });
  const url = new URL(calls[0].url, ORIGIN);
  assert.equal(url.pathname, `/api/dentistry/patients/${PATIENT}/clinical-encounters`);
  assert.deepEqual(Object.fromEntries(url.searchParams), { status: "IN_PROGRESS", search: "dolor leve" });
  assert.equal(result.pagination.totalItems, 1);
  const [encounter] = result.items;
  assert.equal("endedAt" in encounter, false);
  assert.equal("branchName" in encounter, false);
  assert.equal(encounter.examinationSummary, null);
  assert.equal(encounter.chiefComplaint, "Dolor");
  assert.equal("toothNumber" in encounter.procedures[0], false);
  await source.list(PATIENT);
  assert.equal(calls[1].url, `/api/dentistry/patients/${PATIENT}/clinical-encounters`);
});

test("HTTP adapter: mutaciones usan las rutas y payloads del contrato", async (t) => {
  const { source, calls } = loadSource(t, (url) => {
    if (String(url).endsWith("/procedures")) return Response.json([encounterDto.procedures[0]], { status: 201 });
    if (String(url).endsWith("/health-profile")) {
      return Response.json({
        patientId: PATIENT, medicalHistory: null, allergies: "Penicilina", currentMedications: null,
        dentalHistory: null, relevantConditions: null, observations: null, updatedAt: null, rowVersion: 0,
      });
    }
    return Response.json(encounterDto);
  });
  const input = { patientId: PATIENT, branchId: "branch-1", startedAt: "2026-11-11T14:00:00.000Z" };
  await source.create(input);
  await source.addProcedures(PATIENT, ENCOUNTER, [{ targetType: "TOOTH", toothNumber: "11", description: "Resina" }]);
  await source.complete(PATIENT, ENCOUNTER, { endedAt: "2026-11-11T15:00:00.000Z" });
  await source.void(PATIENT, ENCOUNTER, { reason: "Duplicado" });
  const profile = await source.saveHealthProfile(PATIENT, { allergies: "Penicilina" });
  const base = `/api/dentistry/patients/${PATIENT}/clinical-encounters`;
  assert.deepEqual(
    calls.map(({ url, init }) => [init.method, url]),
    [
      ["POST", base],
      ["POST", `${base}/${ENCOUNTER}/procedures`],
      ["POST", `${base}/${ENCOUNTER}/complete`],
      ["POST", `${base}/${ENCOUNTER}/void`],
      ["PATCH", `/api/dentistry/patients/${PATIENT}/health-profile`],
    ],
  );
  assert.deepEqual(calls[0].body, input);
  assert.deepEqual(calls[1].body, { procedures: [{ targetType: "TOOTH", toothNumber: "11", description: "Resina" }] });
  assert.deepEqual(calls[3].body, { reason: "Duplicado" });
  assert.ok(calls.every(({ init }) => init.headers.get("content-type") === "application/json"));
  assert.equal(profile.allergies, "Penicilina");
  assert.equal(profile.rowVersion, 0);
  assert.equal("updatedAt" in profile, false);
});

test("HTTP adapter: los errores conservan estado y mensaje; archivos siguen no disponibles", async (t) => {
  const { source, load } = loadSource(t, () =>
    Response.json({ statusCode: 409, message: "Solo se puede completar una atención en curso.", code: "ENCOUNTER_NOT_IN_PROGRESS" }, { status: 409 }),
  );
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const { ClinicalEncounterApiUnavailableError } = load("src/features/clinical-encounter/services/clinical-encounter.error.ts");
  await assert.rejects(source.complete(PATIENT, ENCOUNTER, { endedAt: "2026-11-11T15:00:00.000Z" }), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 409);
    assert.equal(error.message, "Solo se puede completar una atención en curso.");
    return true;
  });
  await assert.rejects(source.listFiles(PATIENT), ClinicalEncounterApiUnavailableError);
  await assert.rejects(source.addFile(PATIENT, {}), ClinicalEncounterApiUnavailableError);
  await assert.rejects(source.removeFile(PATIENT, "file"), ClinicalEncounterApiUnavailableError);
});

function bffRequest(path, method = "GET", body) {
  return new NextRequest(`${ORIGIN}/api/dentistry/${path}`, {
    method,
    ...(method !== "GET"
      ? { headers: { origin: ORIGIN, "content-type": "application/json" }, body: JSON.stringify(body ?? {}) }
      : {}),
  });
}

test("BFF: permite solo las rutas clínicas acordadas", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const forwarded = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    forwarded.push(`${init.method} ${url.pathname}${url.search}`);
    return Response.json({});
  });
  const base = `patients/${PATIENT}/clinical-encounters`;
  const allowed = [
    ["GET", `${base}?status=COMPLETED&search=dolor&page=1&pageSize=20&practitionerMembershipId=${ENCOUNTER}`],
    ["POST", base],
    ["GET", `${base}/reference-data`],
    ["GET", `${base}/${ENCOUNTER}`],
    ["POST", `${base}/${ENCOUNTER}/procedures`],
    ["POST", `${base}/${ENCOUNTER}/complete`],
    ["POST", `${base}/${ENCOUNTER}/void`],
    ["GET", `patients/${PATIENT}/health-profile`],
    ["PATCH", `patients/${PATIENT}/health-profile`],
    ["GET", "patients?createdFrom=2026-11-01&createdTo=2026-11-30"],
  ];
  for (const [method, path] of allowed) {
    const response = await proxyToDentistry(bffRequest(path, method), path.split("?")[0].split("/"));
    assert.equal(response.status, 200, `${method} ${path}`);
  }
  assert.equal(forwarded.length, allowed.length);

  const rejected = [
    ["DELETE", `${base}/${ENCOUNTER}`, 404],
    ["PATCH", `${base}/${ENCOUNTER}`, 404],
    ["GET", `${base}/not-a-uuid`, 404],
    ["POST", `${base}/${ENCOUNTER}/procedures/${ENCOUNTER}/void`, 404],
    ["GET", `patients/${PATIENT}/clinical-files`, 404],
    ["GET", `${base}?organizationId=${ENCOUNTER}`, 400],
    ["GET", `${base}?search=${"x".repeat(101)}`, 400],
    ["GET", `${base}/reference-data?patientId=${PATIENT}`, 400],
  ];
  for (const [method, path, status] of rejected) {
    const response = await proxyToDentistry(bffRequest(path, method), path.split("?")[0].split("/"));
    assert.equal(response.status, status, `${method} ${path}`);
  }
  assert.equal(forwarded.length, allowed.length);
});
