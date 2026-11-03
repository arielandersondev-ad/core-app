import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MutationObserver, QueryObserver } from "@tanstack/react-query";
import { createSourceLoader } from "./support/load-source.mjs";

const session = {
  user: { id: "user-a" }, context: { organizationId: "organization-a", membershipId: "membership-a", branchIds: [] },
  permissions: ["dentistry:patients:read", "dentistry:patients:create"],
};
const created = { id: "patient-a", organizationId: "organization-a", firstName: "Ana", lastName: "Pérez", fullName: "Ana Pérez", status: "ACTIVE" };

test("creation schema trims text, omits blank optional fields and strips client context", () => {
  const load = createSourceLoader();
  const { createPatientSchema } = load("src/features/patient/schemas/create-patient.schema.ts");
  const { initialPatientValues } = load("src/features/patient/types/patient-form.ts");
  const parsed = createPatientSchema.parse({ ...initialPatientValues, firstName: " Ana ", lastName: " Pérez ", organizationId: "forged", createdByMembershipId: "forged" });
  assert.deepEqual(JSON.parse(JSON.stringify(parsed)), { firstName: "Ana", lastName: "Pérez" });
  const complete = createPatientSchema.parse({ ...initialPatientValues, firstName: "Ana", lastName: "Pérez", email: " ana@example.invalid ", phone: " 70000000 ", birthDate: "2000-02-29", sex: "FEMALE", documentType: " CI ", documentNumber: " 1234 ", notes: " Nota " });
  assert.equal(complete.email, "ana@example.invalid");
  assert.equal(complete.phone, "70000000");
  assert.equal(complete.birthDate, "2000-02-29");
  assert.equal(complete.sex, "FEMALE");
  assert.equal(complete.documentNumber, "1234");
  assert.equal(complete.notes, "Nota");
});

test("creation schema validates required names, real dates, email, sex and paired documents", () => {
  const load = createSourceLoader();
  const { createPatientSchema } = load("src/features/patient/schemas/create-patient.schema.ts");
  const { initialPatientValues } = load("src/features/patient/types/patient-form.ts");
  const base = { ...initialPatientValues, firstName: "Ana", lastName: "Pérez" };
  for (const [change, field] of [
    [{ firstName: " " }, "firstName"], [{ lastName: "" }, "lastName"], [{ email: "invalid" }, "email"],
    [{ birthDate: "2023-02-29" }, "birthDate"], [{ birthDate: "2024-01-01T00:00:00Z" }, "birthDate"],
    [{ sex: "F" }, "sex"], [{ documentType: "CI" }, "documentNumber"], [{ documentNumber: "1234" }, "documentType"],
  ]) {
    const result = createPatientSchema.safeParse({ ...base, ...change });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path[0] === field));
  }
});

test("creation verifies the session, sends only patient data and invalidates every cached list", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientCreateOptions, patientListOptions } = load("src/features/patient/api/query-options.ts");
  const client = createQueryClient();
  t.after(() => client.clear());
  const firstKey = patientListOptions({ page: 1, pageSize: 20 }).queryKey;
  const filteredKey = patientListOptions({ page: 3, pageSize: 10, status: "INACTIVE", search: "Ana" }).queryKey;
  client.setQueryData(firstKey, { items: [], pagination: {} });
  client.setQueryData(filteredKey, { items: [], pagination: {} });
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url, init });
    return url === "/api/auth/me" ? Response.json(session) : Response.json(created, { status: 201 });
  });
  const mutation = new MutationObserver(client, patientCreateOptions(client, session));
  assert.deepEqual(await mutation.mutate({ firstName: "Ana", lastName: "Pérez" }), created);
  assert.equal(requests[0].url, "/api/auth/me");
  assert.equal(requests[1].url, "/api/dentistry/patients");
  assert.equal(requests[1].init.method, "POST");
  assert.deepEqual(JSON.parse(requests[1].init.body), { firstName: "Ana", lastName: "Pérez" });
  assert.equal(client.getQueryState(firstKey).isInvalidated, true);
  assert.equal(client.getQueryState(filteredKey).isInvalidated, true);
});

test("expired or changed sessions block POST; reauthentication in the original context permits retry", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientCreateOptions } = load("src/features/patient/api/query-options.ts");
  const { SessionContextChangedError } = load("src/infrastructure/auth/session-context.ts");
  const client = createQueryClient();
  t.after(() => client.clear());
  let activeSession = null;
  let posts = 0;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url === "/api/auth/me") return activeSession ? Response.json(activeSession) : Response.json({ message: "Sesión vencida" }, { status: 401 });
    posts++;
    return Response.json(created, { status: 201 });
  });
  const values = { firstName: "Ana", lastName: "Pérez", notes: "Conservar este texto" };
  const mutation = new MutationObserver(client, patientCreateOptions(client, session));
  await assert.rejects(mutation.mutate(values), (error) => error.status === 401);
  for (const changed of [
    { ...session, user: { id: "user-b" } },
    { ...session, context: { ...session.context, organizationId: "organization-b" } },
    { ...session, context: { ...session.context, membershipId: "membership-b" } },
  ]) {
    activeSession = changed;
    await assert.rejects(mutation.mutate(values), SessionContextChangedError);
  }
  assert.equal(posts, 0);
  assert.deepEqual(values, { firstName: "Ana", lastName: "Pérez", notes: "Conservar este texto" });
  activeSession = session;
  assert.deepEqual(await mutation.mutate(values), created);
  assert.equal(posts, 1);
});

test("failed writes are never retried automatically and do not invalidate the list", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientCreateOptions, patientListOptions } = load("src/features/patient/api/query-options.ts");
  let status;
  let posts;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url === "/api/auth/me") return Response.json(session);
    posts++;
    return Response.json({ message: "Error de creación" }, { status });
  });
  for (status of [400, 401, 403, 409, 502, 504]) {
    const client = createQueryClient();
    const key = patientListOptions({ page: 1, pageSize: 20 }).queryKey;
    client.setQueryData(key, { items: [] });
    posts = 0;
    try {
      const mutation = new MutationObserver(client, patientCreateOptions(client, session));
      await assert.rejects(mutation.mutate({ firstName: "Ana", lastName: "Pérez" }), (error) => error.status === status);
      assert.equal(posts, 1);
      assert.equal(client.getQueryState(key).isInvalidated, false);
    } finally { client.clear(); }
  }
});

test("a failed list refresh after a successful POST still reports successful creation", async (t) => {
  const load = createSourceLoader();
  const { createQueryClient } = load("src/infrastructure/query/query-client.ts");
  const { patientCreateOptions, patientListOptions } = load("src/features/patient/api/query-options.ts");
  const client = createQueryClient();
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retryDelay: 0 } });
  t.after(() => client.clear());
  const options = patientListOptions({ page: 1, pageSize: 20 });
  client.setQueryData(options.queryKey, { items: [] });
  let posts = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    if (url === "/api/auth/me") return Response.json(session);
    if (init.method === "POST") { posts++; return Response.json(created, { status: 201 }); }
    return Response.json({ message: "Error al actualizar listado" }, { status: 502 });
  });
  const list = new QueryObserver(client, options);
  const unsubscribe = list.subscribe(() => {});
  t.after(unsubscribe);
  const mutation = new MutationObserver(client, patientCreateOptions(client, session));
  assert.deepEqual(await mutation.mutate({ firstName: "Ana", lastName: "Pérez" }), created);
  assert.equal(posts, 1);
  assert.equal(list.getCurrentResult().isError, true);
});

test("form reuses the real UI fields and offers reauthentication without automatic navigation", () => {
  const ui = createSourceLoader();
  const load = createSourceLoader({
    "@/shared/components/ui": {
      ...ui("../../packages/ui/src/components/ui/Input.tsx"),
      ...ui("../../packages/ui/src/components/ui/Select.tsx"),
      ...ui("../../packages/ui/src/components/ui/Button.tsx"),
      ...ui("../../packages/ui/src/components/ui/Label.tsx"),
    },
  });
  const { CreatePatientForm } = load("src/features/patient/components/forms/create-patient-form.tsx");
  const { ApiError } = load("src/infrastructure/http/api-error.ts");
  const html = renderToStaticMarkup(createElement(CreatePatientForm, { onSubmit: async () => {}, onCancel: () => {}, isSubmitting: false, error: new ApiError(401, "Sesión vencida") }));
  assert.match(html, /name="firstName"/);
  assert.match(html, /name="lastName"/);
  assert.match(html, /name="documentType"/);
  assert.match(html, /Guardar paciente/);
  assert.match(html, /target="_blank"/);
  assert.match(html, /Lo escrito se mantiene/);
  assert.doesNotMatch(html, /name="organizationId"|name="createdByMembershipId"|Alergias|Sangre/);
});
