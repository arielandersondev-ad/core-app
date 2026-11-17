import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const {
  buildCompleteInput,
  canAddProcedures,
  canComplete,
  canVoid,
  summarizeProcedures,
} = load("src/features/clinical-encounter/utils/encounter-detail.ts");

const STATUSES = ["IN_PROGRESS", "COMPLETED", "VOIDED"];

test("Encounter detail: canComplete solo permite IN_PROGRESS", () => {
  assert.deepEqual(
    STATUSES.map((status) => canComplete(status)),
    [true, false, false],
  );
});

test("Encounter detail: canVoid permite IN_PROGRESS y COMPLETED, no VOIDED", () => {
  assert.deepEqual(
    STATUSES.map((status) => canVoid(status)),
    [true, true, false],
  );
});

test("Encounter detail: canAddProcedures solo permite IN_PROGRESS", () => {
  assert.deepEqual(
    STATUSES.map((status) => canAddProcedures(status)),
    [true, false, false],
  );
});

test("Encounter detail: summarizeProcedures separa registrados y anulados", () => {
  const procedures = [
    { id: "p1", status: "RECORDED" },
    { id: "p2", status: "VOIDED", voidReason: "Duplicado" },
    { id: "p3", status: "RECORDED" },
  ];

  assert.deepEqual(summarizeProcedures(procedures), {
    total: 3,
    recorded: 2,
    voided: 1,
  });

  assert.deepEqual(summarizeProcedures([]), { total: 0, recorded: 0, voided: 0 });
  assert.deepEqual(summarizeProcedures(), { total: 0, recorded: 0, voided: 0 });
});

test("Encounter detail: buildCompleteInput construye el instante y normaliza el resumen", () => {
  const expected = new Date(2026, 10, 8, 9, 30, 0, 0).toISOString();

  assert.deepEqual(buildCompleteInput("2026-11-08", "09:30", "  Obturación 16  "), {
    endedAt: expected,
    procedureSummary: "Obturación 16",
  });

  assert.deepEqual(buildCompleteInput("2026-11-08", "09:30"), {
    endedAt: expected,
    procedureSummary: null,
  });

  assert.deepEqual(buildCompleteInput("2026-11-08", "09:30", "   "), {
    endedAt: expected,
    procedureSummary: null,
  });
});

test("Encounter detail: buildCompleteInput devuelve null con fecha u hora inválidas", () => {
  assert.equal(buildCompleteInput("", "09:30", "Resumen"), null);
  assert.equal(buildCompleteInput("2026-11-08", "", "Resumen"), null);
  assert.equal(buildCompleteInput("2026-02-31", "09:30", "Resumen"), null);
  assert.equal(buildCompleteInput("2026-11-08", "24:00", "Resumen"), null);
  assert.equal(buildCompleteInput("2026-11-08", "09:60", "Resumen"), null);
});
