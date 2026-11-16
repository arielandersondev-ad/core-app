import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { NextRequest } from "next/server.js";
import { createBffLoader, createSourceLoader } from "./support/load-source.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ORIGIN = "https://clinic.test";

test("Cupo de pacientes: decide el aviso y la etiqueta del contador", () => {
  const load = createSourceLoader();
  const { isPatientLimitReached, patientQuotaLabel, PATIENT_LIMIT_MESSAGE } = load(
    "src/features/patient/utils/patient-quota.ts",
  );
  assert.equal(isPatientLimitReached({ used: 299, limit: 300 }), false);
  assert.equal(isPatientLimitReached({ used: 300, limit: 300 }), true);
  assert.equal(isPatientLimitReached({ used: 301, limit: 300 }), true);
  // Sin cupo en el plan, o sin datos todavía, no se bloquea.
  assert.equal(isPatientLimitReached({ used: 5000, limit: null }), false);
  assert.equal(isPatientLimitReached(undefined), false);

  assert.equal(patientQuotaLabel({ used: 12, limit: 300 }), "12 / 300");
  assert.equal(patientQuotaLabel({ used: 12, limit: null }), null);
  assert.equal(patientQuotaLabel(undefined), null);
  assert.match(PATIENT_LIMIT_MESSAGE, /Mejora tu plan/);
});

test("Cupo de pacientes: el 403 PLAN_LIMIT_REACHED se distingue de la falta de permiso", async (t) => {
  const load = createSourceLoader();
  const { isPlanLimitError } = load("src/features/patient/utils/patient-quota.ts");
  const { createPatient, fetchPatientQuota } = load("src/features/patient/services/patient.service.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");

  const responses = [
    Response.json(
      { statusCode: 403, code: "PLAN_LIMIT_REACHED", resource: "patients", limit: 300, message: "El plan actual permite hasta 300 pacientes. Mejora tu plan para agregar más." },
      { status: 403 },
    ),
    Response.json({ statusCode: 403, message: "Forbidden resource" }, { status: 403 }),
    Response.json({ used: 300, limit: 300 }),
  ];
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push([init.method, url]);
    return responses.shift();
  });

  const limitError = await createPatient({ firstName: "Ana", lastName: "Pérez" }).catch((error) => error);
  assert.ok(limitError instanceof ApiError);
  assert.equal(limitError.status, 403);
  assert.equal(limitError.code, "PLAN_LIMIT_REACHED");
  assert.equal(isPlanLimitError(limitError), true);

  const permissionError = await createPatient({ firstName: "Ana", lastName: "Pérez" }).catch((error) => error);
  assert.equal(permissionError.code, undefined);
  assert.equal(isPlanLimitError(permissionError), false);
  assert.equal(isPlanLimitError(new Error("x")), false);

  assert.deepEqual(await fetchPatientQuota(), { used: 300, limit: 300 });
  assert.deepEqual(calls.at(-1), ["GET", "/api/dentistry/patients/quota"]);
});

test("Cupo de pacientes: el BFF solo permite leer /patients/quota", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const forwarded = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    forwarded.push(`${init.method} ${url.pathname}`);
    return Response.json({ used: 1, limit: 300 });
  });
  const request = (target, method = "GET") =>
    new NextRequest(`${ORIGIN}/api/dentistry/${target}`, {
      method,
      ...(method !== "GET"
        ? { headers: { origin: ORIGIN, "content-type": "application/json" }, body: "{}" }
        : {}),
    });

  assert.equal((await proxyToDentistry(request("patients/quota"), ["patients", "quota"])).status, 200);
  assert.deepEqual(forwarded, ["GET /quota".replace("/quota", "/patients/quota")]);
  assert.equal((await proxyToDentistry(request("patients/quota?organizationId=x"), ["patients", "quota"])).status, 400);
  for (const method of ["POST", "PATCH", "DELETE"]) {
    assert.equal((await proxyToDentistry(request("patients/quota", method), ["patients", "quota"])).status, 404);
  }
  assert.equal(forwarded.length, 1);
});

test("Cupo de pacientes: la UI muestra el contador, bloquea el alta y refresca el cupo", () => {
  const read = (file) => fs.readFileSync(path.join(root, "src/features/patient", file), "utf8");
  const button = read("components/create-patient-button.tsx");
  assert.match(button, /disabled=\{limitReached\}/);
  assert.match(button, /limitReached \? \(/);
  assert.match(read("components/forms/patient-form.tsx"), /isPlanLimitError\(error\)\s*\?\s*PATIENT_LIMIT_MESSAGE/);
  const page = read("views/patients-page.tsx");
  assert.match(page, /<PatientQuotaCounter \/>/);
  assert.match(page, /<PatientLimitNotice \/>/);
  // La clave del cupo cuelga de `patientQueryKeys.all`, que se invalida al crear o eliminar.
  assert.match(read("api/query-options.ts"), /quota: \["patients", "quota"\]/);
});
