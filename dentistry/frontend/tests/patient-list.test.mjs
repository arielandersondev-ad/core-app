import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryObserver } from "@tanstack/react-query";
import { createSourceLoader } from "./support/load-source.mjs";

const patient = {
  id: "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362", organizationId: "organization-from-token",
  firstName: "Ana", lastName: "Pérez", fullName: "Ana Pérez", email: null, phone: null,
  birthDate: "1990-03-14", sex: "FEMALE", documentType: "CI", documentNumber: "12345",
  address: null, notes: null, status: "ACTIVE", createdAt: "2026-10-26T12:00:00.000Z", updatedAt: "2026-10-26T12:00:00.000Z",
};

test("URL criteria use valid defaults and every filter/size change resets the page", () => {
  const { readPatientListParams, updatePatientListParams } = createSourceLoader()("src/features/patient/utils/patient-list.ts");
  assert.deepEqual(readPatientListParams(new URLSearchParams()), { search: undefined, status: undefined, page: 1, pageSize: 20 });
  assert.deepEqual(readPatientListParams(new URLSearchParams("search=%20Ana%20&status=INACTIVE&page=3&pageSize=50")), { search: "Ana", status: "INACTIVE", page: 3, pageSize: 50 });
  for (const query of ["page=0&pageSize=101&status=unknown", "page=-1&pageSize=0", "page=Infinity&pageSize=abc", "page=2.5&pageSize=1.5"]) {
    const params = readPatientListParams(new URLSearchParams(query));
    assert.equal(params.page, 1);
    assert.equal(params.pageSize, 20);
    assert.equal(params.status, undefined);
  }
  for (const change of [{ search: "Ana" }, { status: "ACTIVE" }, { pageSize: 50 }, { search: "", status: "" }]) {
    assert.equal(updatePatientListParams("page=8&pageSize=20&search=Bea", change).get("page"), "1");
  }
  const page = updatePatientListParams("search=Ana&status=ACTIVE&page=1&pageSize=50", { page: 3 });
  assert.deepEqual(Object.fromEntries(page), { search: "Ana", status: "ACTIVE", page: "3", pageSize: "50" });
  const cleared = updatePatientListParams(page.toString(), { search: "", status: "" });
  assert.equal(cleared.has("search"), false);
  assert.equal(cleared.has("status"), false);
});

test("server results are cached by all criteria and a new session client starts empty", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientListOptions } = load("src/features/patient/api/query-options.ts");
  const client = createQueryClient();
  t.after(() => client.clear());
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    requests.push(url);
    const params = new URL(url, "https://clinic.test").searchParams;
    return Response.json({ items: [patient], pagination: { page: Number(params.get("page")), pageSize: Number(params.get("pageSize")), totalItems: 81, totalPages: 5 } });
  });
  const base = { search: "Ana", status: "ACTIVE", page: 1, pageSize: 20 };
  const first = await client.fetchQuery(patientListOptions(base));
  assert.equal(first.pagination.totalItems, 81);
  await client.fetchQuery(patientListOptions({ ...base }));
  assert.equal(requests.length, 1);
  for (const criteria of [{ ...base, page: 2 }, { ...base, pageSize: 50 }, { ...base, status: "INACTIVE" }, { ...base, search: "Bea" }]) {
    await client.fetchQuery(patientListOptions(criteria));
  }
  assert.equal(requests.length, 5);
  const otherSessionClient = createQueryClient();
  t.after(() => otherSessionClient.clear());
  assert.equal(otherSessionClient.getQueryData(patientListOptions(base).queryKey), undefined);
});

test("401/403 are not retried; transient errors retry once", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientListOptions } = load("src/features/patient/api/query-options.ts");
  let status;
  let calls;
  t.mock.method(globalThis, "fetch", async () => {
    calls++;
    return Response.json({ message: "Error de prueba" }, { status });
  });
  for (status of [400, 401, 403, 502, 504]) {
    calls = 0;
    const client = createQueryClient();
    try {
      await assert.rejects(client.fetchQuery({ ...patientListOptions({ page: 1, pageSize: 20 }), retryDelay: 0 }), (error) => error.status === status);
      assert.equal(calls, status >= 500 ? 2 : 1);
    } finally { client.clear(); }
  }
});

test("changing criteria cancels the previous request and displays only the new response", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientListOptions } = load("src/features/patient/api/query-options.ts");
  const client = createQueryClient();
  t.after(() => client.clear());
  let oldSignal;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (new URL(url, "https://clinic.test").searchParams.get("search") === "anterior") {
      oldSignal = init.signal;
      return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => reject(init.signal.reason), { once: true }));
    }
    return Response.json({ items: [{ ...patient, firstName: "Bea", fullName: "Bea Pérez" }], pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } });
  });
  const observer = new QueryObserver(client, patientListOptions({ search: "anterior", page: 1, pageSize: 20 }));
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  assert.ok(oldSignal);
  const completed = new Promise((resolve) => {
    const stop = observer.subscribe((result) => {
      if (result.isSuccess) { stop(); resolve(result.data); }
    });
  });
  observer.setOptions(patientListOptions({ search: "Bea", page: 1, pageSize: 20 }));
  const result = await completed;
  assert.equal(oldSignal.aborted, true);
  assert.equal(result.items[0].fullName, "Bea Pérez");
});

test("the table renders the full server page and civil birth dates without fake clinical fields", () => {
  const { PatientTable } = createSourceLoader()("src/features/patient/components/patient-table.tsx");
  const patients = Array.from({ length: 25 }, (_, index) => ({ ...patient, id: `patient-${index}`, fullName: `Paciente ${index}` }));
  const html = renderToStaticMarkup(createElement(PatientTable, { patients }));
  assert.equal((html.match(/<tr/g) ?? []).length, 26);
  assert.match(html, /Paciente 24/);
  assert.match(html, /14\/03\/1990/);
  assert.match(html, /CI 12345/);
  assert.match(html, /Activo/);
  assert.doesNotMatch(html, /Última visita|Alergias|Sangre/);
});

test("numbered pagination stays bounded for large totals and handles the current server page", () => {
  const load = createSourceLoader();
  const { visiblePatientPages } = load("src/features/patient/utils/patient-list.ts");
  assert.deepEqual(visiblePatientPages(1, 0), []);
  assert.deepEqual(visiblePatientPages(2, 3), [1, 2, 3]);
  const pages = visiblePatientPages(5000, 10000);
  assert.ok(pages.length <= 7);
  assert.equal(pages[0], 1);
  assert.equal(pages.at(-1), 10000);
  assert.ok(pages.includes(5000));
  const { PatientPagination } = load("src/features/patient/components/patient-pagination.tsx");
  const html = renderToStaticMarkup(createElement(PatientPagination, { pagination: { page: 2, pageSize: 20, totalItems: 41, totalPages: 3 }, disabled: false, onChange: () => {} }));
  assert.match(html, /Página 2 de 3/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /aria-label="Página 3"/);
});

test("error states distinguish expired sessions, forbidden access and transient failures", () => {
  const load = createSourceLoader();
  const { PatientListError } = load("src/features/patient/components/patient-list-error.tsx");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const render = (status) => renderToStaticMarkup(createElement(PatientListError, { error: new ApiError(status, "private detail"), loginHref: "/login?returnTo=%2Fpatients%3Fsearch%3DAna", onRetry: () => {} }));
  assert.match(render(401), /Tu sesión venció/);
  assert.match(render(401), /returnTo=%2Fpatients%3Fsearch%3DAna/);
  assert.doesNotMatch(render(401), /Reintentar/);
  assert.match(render(403), /No tienes permiso/);
  assert.doesNotMatch(render(403), /Reintentar|Iniciar sesión|private detail/);
  assert.match(render(504), /tardó demasiado/);
  assert.match(render(502), /Reintentar/);
});
