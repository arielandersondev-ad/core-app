import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const { computeAge } = load("src/features/clinical-encounter/utils/age.ts");
const {
  buildInstant,
  durationLabel,
  formatDateOnly,
  formatDateTimeShort,
  formatTimeOnly,
  parseDate,
  toDateInputValue,
  toTimeInputValue,
} = load("src/features/clinical-encounter/utils/dates.ts");
const { formatBytes } = load("src/features/clinical-encounter/utils/format.ts");
const { ProcedureValidationError, toProcedureDrafts } = load(
  "src/features/clinical-encounter/utils/procedures.ts",
);

test("Clinical encounter utils: computeAge usa fecha civil y rechaza entradas inválidas", () => {
  assert.equal(computeAge(null), null);
  assert.equal(computeAge(undefined), null);
  assert.equal(computeAge(""), null);
  assert.equal(computeAge("no-es-fecha"), null);
  assert.equal(computeAge("2026-02-31"), null);
  assert.equal(computeAge("2026-13-01"), null);
  assert.equal(computeAge("2000-01-01"), new Date().getFullYear() - 2000);
});

test("Clinical encounter utils: buildInstant valida fecha y hora y devuelve null si son inválidas", () => {
  const expected = new Date(2026, 10, 8, 9, 30, 0, 0).toISOString();
  assert.equal(buildInstant("2026-11-08", "09:30"), expected);

  assert.equal(buildInstant("", "09:30"), null);
  assert.equal(buildInstant("2026-11-08", ""), null);
  assert.equal(buildInstant("2026-02-31", "09:30"), null);
  assert.equal(buildInstant("2026-11-08", "24:00"), null);
  assert.equal(buildInstant("2026-11-08", "09:60"), null);
});

test("Clinical encounter utils: toProcedureDrafts expande piezas y deduplica", () => {
  const drafts = toProcedureDrafts({
    targetType: "TOOTH",
    toothNumber: "16, 17 18",
    targetDescription: "",
    description: "Obturación con resina",
    treatmentProcedureId: "",
  });

  assert.equal(drafts.length, 3);
  assert.deepEqual(
    drafts.map((draft) => draft.toothNumber),
    ["16", "17", "18"],
  );
  assert.ok(drafts.every((draft) => draft.targetType === "TOOTH"));
  assert.ok(drafts.every((draft) => draft.description === "Obturación con resina"));
  assert.ok(drafts.every((draft) => draft.treatmentProcedureId === undefined));

  const deduped = toProcedureDrafts({
    targetType: "TOOTH",
    toothNumber: "16, 16, 17",
    targetDescription: "",
    description: "Sellado",
    treatmentProcedureId: "treatment-procedure-corona",
  });

  assert.equal(deduped.length, 2);
  assert.deepEqual(
    deduped.map((draft) => draft.toothNumber),
    ["16", "17"],
  );
  assert.equal(deduped[0].treatmentProcedureId, "treatment-procedure-corona");
});

test("Clinical encounter utils: toProcedureDrafts valida FDI y descripción", () => {
  assert.throws(
    () =>
      toProcedureDrafts({
        targetType: "TOOTH",
        toothNumber: "19",
        targetDescription: "",
        description: "Obturación",
        treatmentProcedureId: "",
      }),
    ProcedureValidationError,
  );

  assert.throws(
    () =>
      toProcedureDrafts({
        targetType: "TOOTH",
        toothNumber: "",
        targetDescription: "",
        description: "Obturación",
        treatmentProcedureId: "",
      }),
    ProcedureValidationError,
  );

  assert.throws(
    () =>
      toProcedureDrafts({
        targetType: "WHOLE_MOUTH",
        toothNumber: "",
        targetDescription: "",
        description: "   ",
        treatmentProcedureId: "",
      }),
    ProcedureValidationError,
  );
});

test("Clinical encounter utils: toProcedureDrafts acepta las piezas FDI válidas y rechaza las inexistentes", () => {
  const validFdi = [
    ...["1", "2", "3", "4"].flatMap((quadrant) =>
      ["1", "2", "3", "4", "5", "6", "7", "8"].map((tooth) => `${quadrant}${tooth}`),
    ),
    ...["5", "6", "7", "8"].flatMap((quadrant) =>
      ["1", "2", "3", "4", "5"].map((tooth) => `${quadrant}${tooth}`),
    ),
  ];
  const invalidFdi = ["19", "10", "99", "56", "58", "66", "68", "76", "78", "86", "88"];

  for (const toothNumber of validFdi) {
    const drafts = toProcedureDrafts({
      targetType: "TOOTH",
      toothNumber,
      targetDescription: "",
      description: "Obturación",
      treatmentProcedureId: "",
    });

    assert.equal(drafts.length, 1, `La pieza ${toothNumber} debe ser válida`);
    assert.equal(drafts[0].toothNumber, toothNumber);
  }

  for (const toothNumber of invalidFdi) {
    assert.throws(
      () =>
        toProcedureDrafts({
          targetType: "TOOTH",
          toothNumber,
          targetDescription: "",
          description: "Obturación",
          treatmentProcedureId: "",
        }),
      ProcedureValidationError,
      `La pieza ${toothNumber} debe ser rechazada`,
    );
  }
});

test("Clinical encounter utils: toProcedureDrafts conserva targetDescription en TOOTH", () => {
  const [draft] = toProcedureDrafts({
    targetType: "TOOTH",
    toothNumber: "16",
    targetDescription: "Sector posterior derecho",
    description: "Obturación",
    treatmentProcedureId: "",
  });

  assert.equal(draft.targetType, "TOOTH");
  assert.equal(draft.toothNumber, "16");
  assert.equal(draft.targetDescription, "Sector posterior derecho");
});

test("Clinical encounter utils: fechas civiles inválidas no desbordan", () => {
  assert.equal(parseDate("2024-02-31"), null);
  assert.equal(toDateInputValue("2024-02-31"), "");
  assert.equal(toTimeInputValue("2024-02-31"), "");

  assert.ok(parseDate("2024-02-29") instanceof Date);
  assert.equal(toDateInputValue("2024-02-29"), "2024-02-29");
  assert.equal(toTimeInputValue("2024-02-29"), "00:00");
});

test("Clinical encounter utils: formatDateOnly, formatDateTimeShort y formatTimeOnly manejan inválidos", () => {
  assert.equal(formatDateOnly("2024-02-31"), "—");
  assert.equal(formatDateTimeShort("no-es-fecha"), "—");
  assert.equal(formatTimeOnly(undefined), "—");
  assert.equal(formatTimeOnly(""), "—");
});

test("Clinical encounter utils: toProcedureDrafts limpia toothNumber en objetivos que no son pieza", () => {
  const [draft] = toProcedureDrafts({
    targetType: "REGION",
    toothNumber: "16",
    targetDescription: "Cuadrante superior derecho",
    description: "Profilaxis profesional",
    treatmentProcedureId: "",
  });

  assert.equal(draft.targetType, "REGION");
  assert.equal(draft.toothNumber, undefined);
  assert.equal(draft.targetDescription, "Cuadrante superior derecho");
  assert.equal(draft.description, "Profilaxis profesional");
  assert.equal(draft.treatmentProcedureId, undefined);
});

test("Clinical encounter utils: durationLabel y formatBytes", () => {
  assert.equal(
    durationLabel("2026-11-08T09:00:00.000Z", "2026-11-08T10:05:00.000Z"),
    "1 h 5 min",
  );
  assert.equal(durationLabel("2026-11-08T09:00:00.000Z", "2026-11-08T09:45:00.000Z"), "45 min");
  assert.equal(durationLabel("2026-11-08T09:00:00.000Z"), "En curso");
  assert.equal(durationLabel("fecha-invalida", "otra-fecha"), "—");

  assert.equal(formatBytes(500), "500 B");
  assert.equal(formatBytes(1024), "1.0 KB");
  assert.equal(formatBytes(2048), "2.0 KB");
  assert.equal(formatBytes(1048575), "1.0 MB");
  assert.equal(formatBytes(1048576), "1.0 MB");
  assert.equal(formatBytes(-1), "—");
  assert.equal(formatBytes(Number.NaN), "—");
  assert.equal(formatBytes(Number.POSITIVE_INFINITY), "—");
});
