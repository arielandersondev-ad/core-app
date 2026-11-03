import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { createBffLoader, createSourceLoader } from "./support/load-source.mjs";

const ID = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const patient = {
  id: ID, organizationId: "organization-from-token", firstName: "Ana", lastName: "Pérez", fullName: "Ana Pérez",
  phone: null, email: null, birthDate: "1990-03-14", sex: "FEMALE", documentType: null, documentNumber: null,
  address: null, notes: null, status: "ACTIVE", createdAt: "2026-10-26T12:00:00.000Z", updatedAt: "2026-10-26T12:00:00.000Z",
};

test("list service serializes only allowed criteria, preserves pagination and uses same-origin credentials", async (t) => {
  const { fetchPatients } = createSourceLoader()("src/features/patient/services/patient.service.ts");
  const result = { items: [patient], pagination: { page: 2, pageSize: 20, totalItems: 41, totalPages: 3 } };
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json(result);
  });
  const search = "Ana %_ & ñ";
  assert.deepEqual(await fetchPatients({ search, status: "ACTIVE", page: 2, pageSize: 20, organizationId: "ignored" }), result);
  const query = new URL(calls[0].url, "https://clinic.test").searchParams;
  assert.deepEqual(Object.fromEntries(query), { search, status: "ACTIVE", page: "2", pageSize: "20" });
  assert.equal(calls[0].init.credentials, "same-origin");
  assert.equal(calls[0].init.cache, "no-store");
  assert.equal(calls[0].init.headers.get("accept"), "application/json");
  assert.equal(calls[0].init.headers.get("authorization"), null);
  await fetchPatients();
  assert.equal(calls[1].url, "/api/dentistry/patients");
});

test("detail, create and patch use the current contracts including null versus omission", async (t) => {
  const service = createSourceLoader()("src/features/patient/services/patient.service.ts");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json(patient, { status: init.method === "POST" ? 201 : 200 });
  });
  assert.deepEqual(await service.fetchPatientById(ID), patient);
  assert.equal(calls[0].url, `/api/dentistry/patients/${ID}`);
  const create = { firstName: "Ana", lastName: "Pérez", birthDate: "1990-03-14", sex: "FEMALE" };
  await service.createPatient(create);
  assert.equal(calls[1].init.method, "POST");
  assert.equal(calls[1].init.headers.get("content-type"), "application/json");
  assert.deepEqual(JSON.parse(calls[1].init.body), create);
  const patch = { email: null, phone: undefined, birthDate: null, sex: null, documentType: null, documentNumber: null };
  await service.updatePatient(ID, patch);
  assert.equal(calls[2].url, `/api/dentistry/patients/${ID}`);
  assert.equal(calls[2].init.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[2].init.body), { email: null, birthDate: null, sex: null, documentType: null, documentNumber: null });
  assert.equal(patch.phone, undefined);
  await service.fetchPatientById("id/with?query=value");
  assert.equal(calls[3].url, "/api/dentistry/patients/id%2Fwith%3Fquery%3Dvalue");
});

test("service errors retain HTTP status and validation messages for the future UI", async (t) => {
  const load = createSourceLoader();
  const { createPatient } = load("src/features/patient/services/patient.service.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  let status;
  let message = ["Correo inválido", "Falta el apellido"];
  t.mock.method(globalThis, "fetch", async () => Response.json({ message }, { status }));
  const formValues = { firstName: "Ana", lastName: "Pérez", email: "incorrecto" };
  for (status of [400, 401, 403, 404, 409, 502, 504]) {
    await assert.rejects(createPatient(formValues), (error) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, status);
      assert.equal(error.message, "Correo inválido, Falta el apellido");
      assert.deepEqual(error.messages, message);
      return true;
    });
    assert.deepEqual(formValues, { firstName: "Ana", lastName: "Pérez", email: "incorrecto" });
  }
  status = 403;
  message = "Permiso requerido";
  await assert.rejects(createPatient(formValues), (error) => error.status === 403 && error.message === message);
});

test("network failures and malformed JSON become typed errors without leaking technical details", async (t) => {
  const load = createSourceLoader();
  const { fetchPatients } = load("src/features/patient/services/patient.service.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  let respond = () => { throw new TypeError("private network details"); };
  t.mock.method(globalThis, "fetch", async () => respond());
  await assert.rejects(fetchPatients(), (error) => error instanceof ApiError && error.status === 0 && !error.message.includes("private"));
  respond = () => new Response("invalid JSON", { headers: { "content-type": "application/json" } });
  await assert.rejects(fetchPatients(), (error) => error instanceof ApiError && error.status === 502);
  respond = () => new Response("invalid JSON", { status: 403 });
  await assert.rejects(fetchPatients(), (error) => error instanceof ApiError && error.status === 403 && error.messages.length === 1);
});

test("services traverse the production route and BFF with a cookie token and preserve backend errors", async (t) => {
  const load = createBffLoader();
  const service = load("src/features/patient/services/patient.service.ts");
  const route = load("src/app/api/dentistry/[...path]/route.ts");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const result = { items: [patient], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } };
  const calls = [];
  let denied = false;
  t.mock.method(globalThis, "fetch", async (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/dentistry/")) {
      const method = init.method ?? "GET";
      const url = new URL(input, "https://clinic.test");
      const headers = new Headers(init.headers);
      if (method !== "GET") headers.set("origin", url.origin);
      const req = new NextRequest(url, { ...init, method, headers });
      const path = url.pathname.slice("/api/dentistry/".length).split("/");
      return route[method](req, { params: Promise.resolve({ path }) });
    }
    assert.equal(input.origin, "http://dentistry.test:3004");
    assert.equal(init.headers.Authorization, "Bearer core-issued-dentistry-token");
    calls.push({ url: input, init });
    if (denied) return Response.json({ message: "Permiso requerido" }, { status: 403 });
    if (input.pathname === "/patients" && init.method === "GET") return Response.json(result);
    return Response.json(patient, { status: init.method === "POST" ? 201 : 200 });
  });
  assert.deepEqual(await service.fetchPatients({ search: "Ana", page: 1, pageSize: 20 }), result);
  assert.deepEqual(await service.fetchPatientById(ID), patient);
  const values = { firstName: "Ana", lastName: "Pérez" };
  assert.deepEqual(await service.createPatient(values), patient);
  assert.deepEqual(await service.updatePatient(ID, { phone: null }), patient);
  assert.equal(calls.length, 4);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(calls[2].init.body)), values);
  assert.deepEqual(JSON.parse(new TextDecoder().decode(calls[3].init.body)), { phone: null });
  denied = true;
  await assert.rejects(service.createPatient(values), (error) => error instanceof ApiError && error.status === 403);
  assert.deepEqual(values, { firstName: "Ana", lastName: "Pérez" });
});
