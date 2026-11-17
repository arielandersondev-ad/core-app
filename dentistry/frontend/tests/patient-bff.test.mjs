import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { createBffLoader } from "./support/load-source.mjs";

const ORIGIN = "https://clinic.test";
const ID = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const BODY = { firstName: "Ana", lastName: "Pérez" };

function request(path, method = "GET", options = {}) {
  return new NextRequest(`${ORIGIN}/api/dentistry/${path}`, {
    method,
    ...(method !== "GET" ? {
      headers: { origin: ORIGIN, "content-type": "application/json" },
      body: JSON.stringify(BODY),
    } : {}),
    ...options,
  });
}

test("patient routes use the cookie token, fixed backend, JSON and no-store", async (t) => {
  const route = createBffLoader()("src/app/api/dentistry/[...path]/route.ts");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ id: ID }, { status: init.method === "POST" ? 201 : 200, headers: { Authorization: "private", "Set-Cookie": "private=value" } });
  });
  for (const [method, path] of [["GET", "patients"], ["GET", `patients/${ID}`], ["POST", "patients"], ["PATCH", `patients/${ID}`]]) {
    const req = request(path, method);
    req.headers.set("Authorization", "Bearer supplied-by-browser");
    const response = await route[method](req, { params: Promise.resolve({ path: path.split("/") }) });
    assert.equal(response.status, method === "POST" ? 201 : 200);
    assert.deepEqual(await response.json(), { id: ID });
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("authorization"), null);
    assert.equal(response.headers.get("set-cookie"), null);
    const { url, init } = calls.at(-1);
    assert.equal(url.href, `http://dentistry.test:3004/${path}`);
    assert.equal(init.method, method);
    assert.equal(init.headers.Authorization, "Bearer core-issued-dentistry-token");
    assert.equal(init.headers.Accept, "application/json");
    assert.equal(init.cache, "no-store");
    assert.ok(init.signal instanceof AbortSignal);
    if (method !== "GET") assert.deepEqual(JSON.parse(new TextDecoder().decode(init.body)), BODY);
  }
});

test("missing cookie rejects all four patient operations without contacting the backend", async (t) => {
  const { proxyToDentistry } = createBffLoader({ token: null })("src/infrastructure/http/dentistry-proxy.ts");
  const upstream = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request"); });
  for (const [method, path] of [["GET", "patients"], ["GET", `patients/${ID}`], ["POST", "patients"], ["PATCH", `patients/${ID}`]]) {
    const response = await proxyToDentistry(request(path, method), path.split("/"));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("location"), null);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test("unknown routes, unsupported methods and invalid route ids are rejected", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const upstream = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request"); });
  for (const [method, path] of [["PUT", `patients/${ID}`], ["GET", "patients/not-a-uuid"], ["GET", "patients/extra/path"], ["POST", "auth/login"]]) {
    assert.equal((await proxyToDentistry(request(path, method), path.split("/"))).status, 404);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test("list forwards exact search and pagination and delegates value validation to NestJS", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const search = `Ana %_ & ñ ${"a".repeat(150)}`;
  const query = new URLSearchParams({ search, status: "ACTIVE", page: "2", pageSize: "20" });
  let received;
  const result = { items: [{ id: ID }], pagination: { page: 2, pageSize: 20, totalItems: 41, totalPages: 3 } };
  t.mock.method(globalThis, "fetch", async (url) => {
    received = url;
    return url.searchParams.get("page") === "0"
      ? Response.json({ message: ["page must not be less than 1"] }, { status: 400 })
      : Response.json(result);
  });
  const response = await proxyToDentistry(request(`patients?${query}`), ["patients"]);
  assert.deepEqual(await response.json(), result);
  assert.deepEqual([...received.searchParams], [...query]);
  const invalid = await proxyToDentistry(request("patients?page=0&pageSize=101"), ["patients"]);
  assert.equal(invalid.status, 400);
  assert.equal(received.searchParams.get("pageSize"), "101");
  assert.deepEqual(await invalid.json(), { message: ["page must not be less than 1"] });
});

test("queries reject unknown fields, repetitions and parameters on detail or mutations", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const upstream = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request"); });
  for (const [method, path, query] of [
    ["GET", "patients", "organizationId=other"],
    ["GET", "patients", "createdByMembershipId=other"],
    ["GET", "patients", "sort=createdAt"],
    ["GET", "patients", "page=1&page=2"],
    ["GET", "patients", "search=ana&search=bea"],
    ["GET", `patients/${ID}`, "organizationId=other"],
    ["POST", "patients", "page=1"],
    ["PATCH", `patients/${ID}`, "page=1"],
  ]) {
    assert.equal((await proxyToDentistry(request(`${path}?${query}`, method), path.split("/"))).status, 400);
  }
  assert.equal(upstream.mock.callCount(), 0);
});

test("writes require exact origin, JSON and a body within 64 KiB", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const upstream = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected request"); });
  for (const [headers, status] of [
    [{ "content-type": "application/json" }, 403],
    [{ origin: "https://other.test", "content-type": "application/json" }, 403],
    [{ origin: ORIGIN }, 415],
    [{ origin: ORIGIN, "content-type": "application/json-invalid" }, 415],
    [{ origin: ORIGIN, "content-type": "application/json", "content-length": String(65537) }, 413],
  ]) {
    assert.equal((await proxyToDentistry(request("patients", "POST", { headers }), ["patients"])).status, status);
  }
  let cancelled = false;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(40_000));
      controller.enqueue(new Uint8Array(30_000));
    },
    cancel() { cancelled = true; },
  });
  const response = await proxyToDentistry(request("patients", "POST", {
    body, duplex: "half", headers: { origin: ORIGIN, "content-type": "application/json", "content-length": "1" },
  }), ["patients"]);
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
  assert.equal(upstream.mock.callCount(), 0);
});

test("backend business errors retain status and JSON without redirecting on 401", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  let status;
  t.mock.method(globalThis, "fetch", async () => Response.json({ message: ["Error de validación", "Otro detalle"], statusCode: status }, { status }));
  for (status of [400, 401, 403, 404, 409]) {
    const response = await proxyToDentistry(request("patients"), ["patients"]);
    assert.equal(response.status, status);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { message: ["Error de validación", "Otro detalle"], statusCode: status });
  }
});

test("backend failures and invalid content are hidden; connection and timeout use 502/504", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  let respond = () => Response.json({ message: "private SQL details" }, { status: 500 });
  t.mock.method(globalThis, "fetch", async () => respond());
  const failure = await proxyToDentistry(request("patients"), ["patients"]);
  assert.equal(failure.status, 502);
  assert.doesNotMatch(await failure.text(), /private|SQL/);
  respond = () => new Response("private HTML", { headers: { "content-type": "text/html" } });
  assert.equal((await proxyToDentistry(request("patients"), ["patients"])).status, 502);
  respond = () => { throw new TypeError("private connection details"); };
  assert.equal((await proxyToDentistry(request("patients"), ["patients"])).status, 502);
  respond = () => { throw new DOMException("private timeout details", "TimeoutError"); };
  const timeout = await proxyToDentistry(request("patients"), ["patients"]);
  assert.equal(timeout.status, 504);
  assert.equal(timeout.headers.get("cache-control"), "no-store");
});

test("all five existing appointment operations retain routing and filter restrictions", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return new Response(null, { status: 204 });
  });
  for (const [method, path] of [["GET", "appointments"], ["POST", "appointments"], ["GET", `appointments/${ID}`], ["PATCH", `appointments/${ID}/status`], ["POST", `appointments/${ID}/cancel`]]) {
    const query = path === "appointments" && method === "GET"
      ? `?branchId=${ID}&patientId=${ID}&practitionerMembershipId=${ID}&date=2026-10-26&startDate=2026-10-01&endDate=2026-10-31&status=SCHEDULED` : "";
    const response = await proxyToDentistry(request(`${path}${query}`, method), path.split("/"));
    assert.equal(response.status, 204);
    assert.equal(await response.text(), "");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(calls.at(-1).url.pathname, `/${path}`);
  }
  for (const query of ["unknown=value", `status=${"a".repeat(101)}`]) {
    assert.equal((await proxyToDentistry(request(`appointments?${query}`), ["appointments"])).status, 400);
  }
  assert.equal(calls.length, 5);
});
