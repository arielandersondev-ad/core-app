import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server.js";
import { createBffLoader, createSourceLoader } from "./support/load-source.mjs";

const ORIGIN = "https://clinic.test";
const PATIENT = "bf262a8d-7bd3-49c1-b7a6-8d9bc27fe362";
const TREATMENT = "0f1c3f0e-9b7a-4a52-8a53-3a9d1f0c0a11";
const ENCOUNTER = "7a2f55b1-6c1d-4e0e-9d52-7d0a4bd0e2c3";
const PAYMENT = "5d9e7d6a-3b8e-4c1f-a0b4-6d7f8e9a1b2c";

const load = createSourceLoader();
const { parseAmountToMinor, minorToInputValue, normalizeCurrency } = load(
  "src/features/billing/utils/money.ts",
);
const { toCreateTreatmentInput, toPaymentInput, treatmentAcceptsPayments } = load(
  "src/features/billing/utils/forms.ts",
);

test("los importes se convierten a unidades menores sin decimales binarios", () => {
  assert.equal(parseAmountToMinor("200"), 20_000);
  assert.equal(parseAmountToMinor("10000"), 1_000_000);
  assert.equal(parseAmountToMinor("10 000"), 1_000_000);
  assert.equal(parseAmountToMinor("200,5"), 20_050);
  assert.equal(parseAmountToMinor("200.50"), 20_050);
  assert.equal(parseAmountToMinor("0.29"), 29, "0.29 * 100 sería 28.999… con flotantes");
  assert.equal(parseAmountToMinor("1.15"), 115);
  for (const invalid of ["", "  ", "abc", "-5", "1.234", "1,2,3", "12e3", "99999999999"]) {
    assert.equal(parseAmountToMinor(invalid), null, JSON.stringify(invalid));
  }
});

test("el importe se muestra editable y la moneda se normaliza", () => {
  assert.equal(minorToInputValue(20_000), "200");
  assert.equal(minorToInputValue(20_050), "200.50");
  assert.equal(minorToInputValue(5), "0.05");
  assert.equal(normalizeCurrency(" bob "), "BOB");
  assert.equal(normalizeCurrency("BOLIVIANOS"), null);
});

test("el tratamiento se crea con nombre y, si lo hay, presupuesto y moneda", () => {
  assert.deepEqual(toCreateTreatmentInput({ title: "  Ortodoncia ", budget: "10000", currency: "bob" }), {
    input: { title: "Ortodoncia", agreedPriceMinor: 1_000_000, currency: "BOB" },
  });
  assert.deepEqual(toCreateTreatmentInput({ title: "Evaluación", budget: "  ", currency: "BOB" }), {
    input: { title: "Evaluación" },
  });
  for (const values of [
    { title: "  ", budget: "", currency: "BOB" },
    { title: "x".repeat(121), budget: "", currency: "BOB" },
    { title: "Ortodoncia", budget: "mucho", currency: "BOB" },
    { title: "Ortodoncia", budget: "100", currency: "BOLIVIANOS" },
  ]) {
    assert.ok("error" in toCreateTreatmentInput(values), JSON.stringify(values));
  }
});

const paymentValues = (overrides = {}) => ({
  amount: "200",
  method: "CASH",
  reference: "  Recibo 001 ",
  notes: "",
  branchId: "",
  currency: "BOB",
  ...overrides,
});
const noLimits = { maxMinor: null, askCurrency: false, needsBranch: false };

test("el anticipo de 200 Bs se arma con medio, referencia y sin campos vacíos", () => {
  assert.deepEqual(toPaymentInput(paymentValues(), { ...noLimits, maxMinor: 1_000_000 }), {
    input: { amountMinor: 20_000, paymentMethod: "CASH", reference: "Recibo 001" },
  });
});

test("el pago valida importe, tope de saldo, moneda y sucursal", () => {
  assert.ok("error" in toPaymentInput(paymentValues({ amount: "0" }), noLimits));
  assert.ok("error" in toPaymentInput(paymentValues({ amount: "abc" }), noLimits));
  const over = toPaymentInput(paymentValues({ amount: "10000.01" }), { ...noLimits, maxMinor: 1_000_000 });
  assert.match(over.error, /supera el saldo/);
  assert.ok("input" in toPaymentInput(paymentValues({ amount: "10000" }), { ...noLimits, maxMinor: 1_000_000 }));

  const loose = toPaymentInput(paymentValues({ currency: "usd" }), { ...noLimits, askCurrency: true });
  assert.equal(loose.input.currency, "USD");
  assert.ok("error" in toPaymentInput(paymentValues({ currency: "x" }), { ...noLimits, askCurrency: true }));

  assert.ok("error" in toPaymentInput(paymentValues(), { ...noLimits, needsBranch: true }));
  const withBranch = toPaymentInput(paymentValues({ branchId: "b-1" }), { ...noLimits, needsBranch: true });
  assert.equal(withBranch.input.branchId, "b-1");
});

test("un tratamiento rechazado o cancelado no admite abonos", () => {
  assert.equal(treatmentAcceptsPayments("IN_PROGRESS"), true);
  assert.equal(treatmentAcceptsPayments("COMPLETED"), true);
  assert.equal(treatmentAcceptsPayments("DECLINED"), false);
  assert.equal(treatmentAcceptsPayments("CANCELED"), false);
});

function bffRequest(path, method) {
  return new NextRequest(`${ORIGIN}/api/dentistry/${path}`, {
    method,
    ...(method === "GET"
      ? {}
      : {
          headers: { origin: ORIGIN, "content-type": "application/json" },
          body: JSON.stringify({ amountMinor: 20_000, paymentMethod: "CASH" }),
        }),
  });
}

test("el BFF expone solo las rutas de tratamientos y pagos acordadas", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return Response.json({ ok: true }, { status: 200 });
  });
  const allowed = [
    ["GET", `patients/${PATIENT}/treatments`],
    ["POST", `patients/${PATIENT}/treatments`],
    ["GET", `patients/${PATIENT}/treatments/${TREATMENT}`],
    ["PATCH", `patients/${PATIENT}/treatments/${TREATMENT}`],
    ["GET", `patients/${PATIENT}/treatments/${TREATMENT}/account`],
    ["POST", `patients/${PATIENT}/treatments/${TREATMENT}/payments`],
    ["GET", `patients/${PATIENT}/payments`],
    ["GET", `patients/${PATIENT}/payments/${PAYMENT}`],
    ["POST", `patients/${PATIENT}/payments/${PAYMENT}/void`],
    ["GET", `patients/${PATIENT}/clinical-encounters/${ENCOUNTER}/payment`],
    ["POST", `patients/${PATIENT}/clinical-encounters/${ENCOUNTER}/payment`],
    ["GET", `patients/${PATIENT}/clinical-encounters/${ENCOUNTER}/payment-proposal`],
  ];
  for (const [method, path] of allowed) {
    const response = await proxyToDentistry(bffRequest(path, method), path.split("/"));
    assert.equal(response.status, 200, `${method} ${path}`);
    assert.equal(calls.at(-1).url.href, `http://dentistry.test:3004/${path}`);
  }
  assert.equal(calls.length, allowed.length);

  const rejected = [
    ["DELETE", `patients/${PATIENT}/payments/${PAYMENT}`],
    ["PATCH", `patients/${PATIENT}/payments/${PAYMENT}`],
    ["POST", `patients/${PATIENT}/payments`],
    ["GET", `patients/${PATIENT}/payments/not-a-uuid`],
    ["POST", `patients/${PATIENT}/clinical-encounters/${ENCOUNTER}/payment-proposal`],
    ["GET", `patients/${PATIENT}/treatments/${TREATMENT}/payments`],
  ];
  for (const [method, path] of rejected) {
    const response = await proxyToDentistry(bffRequest(path, method), path.split("/"));
    assert.equal(response.status, 404, `${method} ${path}`);
  }
  assert.equal(calls.length, allowed.length, "las rutas no permitidas no llegan al backend");
});

test("los filtros de pagos y tratamientos son una lista cerrada", async (t) => {
  const { proxyToDentistry } = createBffLoader()("src/infrastructure/http/dentistry-proxy.ts");
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    return Response.json({ items: [] });
  });
  const path = `patients/${PATIENT}/payments`;
  const ok = await proxyToDentistry(
    new NextRequest(`${ORIGIN}/api/dentistry/${path}?treatmentId=${TREATMENT}&status=COMPLETED&page=1&pageSize=20`),
    path.split("/"),
  );
  assert.equal(ok.status, 200);
  assert.equal(calls.at(-1).search, `?treatmentId=${TREATMENT}&status=COMPLETED&page=1&pageSize=20`);
  const bad = await proxyToDentistry(
    new NextRequest(`${ORIGIN}/api/dentistry/${path}?organizationId=${PATIENT}`),
    path.split("/"),
  );
  assert.equal(bad.status, 400);
  const noQuery = `patients/${PATIENT}/treatments/${TREATMENT}/account`;
  const stray = await proxyToDentistry(
    new NextRequest(`${ORIGIN}/api/dentistry/${noQuery}?x=1`),
    noQuery.split("/"),
  );
  assert.equal(stray.status, 400);
});

const { toProcedureDrafts } = load("src/features/clinical-encounter/utils/procedures.ts");
const { toQuickProcedureInput } = load("src/features/clinical-encounter/utils/quick-procedure.ts");

const procedureValues = (overrides = {}) => ({
  targetType: "TOOTH",
  toothNumber: "16, 17",
  targetDescription: "",
  description: "Control de ortodoncia",
  treatmentProcedureId: "",
  ...overrides,
});

test("el precio del procedimiento es opcional y viaja con su moneda en cada fila", () => {
  const sinPrecio = toProcedureDrafts(procedureValues());
  assert.ok(sinPrecio.every((row) => row.priceMinor === undefined && row.currency === undefined));

  const conPrecio = toProcedureDrafts(procedureValues({ price: "150,50", currency: "bob" }));
  assert.equal(conPrecio.length, 2, "una fila por pieza");
  assert.ok(conPrecio.every((row) => row.priceMinor === 15_050 && row.currency === "BOB"));

  const vacio = toProcedureDrafts(procedureValues({ price: "   ", currency: "BOB" }));
  assert.ok(vacio.every((row) => row.priceMinor === undefined && row.currency === undefined));

  assert.throws(() => toProcedureDrafts(procedureValues({ price: "mucho" })), /precio/);
  assert.throws(() => toProcedureDrafts(procedureValues({ price: "10", currency: "BOLIVIANOS" })), /moneda/);
});

test("la atención rápida conserva el precio de cada procedimiento", () => {
  const base = {
    branchId: "branch-1",
    date: "2026-11-16",
    time: "10:30",
    targetType: "WHOLE_MOUTH",
    toothNumber: "",
    targetDescription: "",
    description: "Profilaxis",
    observations: "",
  };
  const now = new Date(2026, 10, 16, 12, 0, 0);
  const priced = toQuickProcedureInput({ ...base, price: "80", currency: "BOB" }, now);
  assert.equal(priced.input.procedures[0].priceMinor, 8_000);
  assert.equal(priced.input.procedures[0].currency, "BOB");
  const free = toQuickProcedureInput(base, now);
  assert.equal("priceMinor" in free.input.procedures[0], false);
  assert.equal("currency" in free.input.procedures[0], false);
});

const { legacyBillingDestination } = load("src/features/billing/utils/legacy-routes.ts");

test("las rutas globales retiradas llevan a la cuenta del paciente o a la lista", () => {
  assert.equal(legacyBillingDestination(PATIENT), `/patients/${PATIENT}/account`);
  assert.equal(legacyBillingDestination([PATIENT, "otro"]), `/patients/${PATIENT}/account`);
  for (const invalid of [undefined, "", "no-es-uuid", "../../admin", `${PATIENT}/../x`]) {
    assert.equal(legacyBillingDestination(invalid), "/patients", String(invalid));
  }
});

test("agregar procedimientos, completar y anular invalidan la propuesta de cobro", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile("src/features/clinical-encounter/api/query-options.ts", "utf8");
  for (const name of [
    "clinicalEncounterAddProceduresOptions",
    "clinicalEncounterCompleteOptions",
    "clinicalEncounterVoidOptions",
  ]) {
    const start = source.indexOf(`export function ${name}`);
    const end = source.indexOf("\nexport function", start + 1);
    const body = source.slice(start, end === -1 ? undefined : end);
    assert.match(body, /invalidateBilling\(client, patientId\)/, `${name} debe refrescar los datos de cobro`);
  }
});

test("el cobro propuesto se ofrece una sola vez tras completar la atención", async () => {
  const { readFile } = await import("node:fs/promises");
  const panel = await readFile("src/features/billing/components/encounter-collection-panel.tsx", "utf8");
  const page = await readFile("src/features/clinical-encounter/components/clinical-encounter-detail-page.tsx", "utf8");
  assert.equal((panel.match(/onPromptHandled\(\)/g) ?? []).length, 2, "al cerrar y al registrar");
  assert.match(page, /onPromptHandled=\{\(\) => setPromptCollection\(false\)\}/);
});
