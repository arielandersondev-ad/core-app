import test from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const {
  appendProcedure,
  describeProcedure,
  emptyCreateForm,
  removeProcedureAt,
  suggestedTreatmentId,
  toCreateInput,
} = load("src/features/clinical-encounter/utils/encounter-create-form.ts");
const { ClinicalEncounterPartialCreateError } = load(
  "src/features/clinical-encounter/services/clinical-encounter.error.ts",
);

function validValues(overrides = {}) {
  return {
    ...emptyCreateForm(),
    branchId: "branch-centro",
    startDate: "2026-11-08",
    startTime: "09:30",
    chiefComplaint: "  Dolor en zona posterior  ",
    examinationSummary: "  Caries oclusal en 16  ",
    diagnosisSummary: "  Caries oclusal  ",
    notes: "  Sin incidencias  ",
    patientInstructions: "  Evitar alimentos duros  ",
    progressNotes: "  Control en 6 meses  ",
    appointmentId: "appointment-control",
    treatmentId: "treatment-ortho",
    ...overrides,
  };
}

test("encounter create form: construye un input válido y recorta los textos", () => {
  const result = toCreateInput(validValues(), "patient-a");

  assert.ok("input" in result);
  assert.equal(result.input.patientId, "patient-a");
  assert.equal(result.input.branchId, "branch-centro");
  assert.equal(result.input.appointmentId, "appointment-control");
  assert.equal(result.input.treatmentId, "treatment-ortho");
  assert.equal(
    result.input.startedAt,
    new Date(2026, 10, 8, 9, 30, 0, 0).toISOString(),
  );
  assert.equal(result.input.chiefComplaint, "Dolor en zona posterior");
  assert.equal(result.input.examinationSummary, "Caries oclusal en 16");
  assert.equal(result.input.diagnosisSummary, "Caries oclusal");
  assert.equal(result.input.notes, "Sin incidencias");
  assert.equal(result.input.patientInstructions, "Evitar alimentos duros");
  assert.equal(result.input.progressNotes, "Control en 6 meses");
});

test("encounter create form: exige una sucursal", () => {
  const result = toCreateInput(validValues({ branchId: "   " }), "patient-a");

  assert.ok("error" in result);
  assert.match(result.error, /sucursal/i);
  assert.equal(result.field, "branchId");
});

test("encounter create form: rechaza fecha u hora inválidas", () => {
  for (const invalid of [
    { startDate: "2026-02-31", startTime: "09:30" },
    { startDate: "", startTime: "09:30" },
    { startDate: "2026-11-08", startTime: "24:00" },
    { startDate: "2026-11-08", startTime: "" },
  ]) {
    const result = toCreateInput(validValues(invalid), "patient-a");
    assert.ok("error" in result);
    assert.match(result.error, /fecha.*hora/i);
    assert.equal(result.field, "startedAt");
  }
});

test("encounter create form: normaliza textos vacíos y referencias en blanco", () => {
  const result = toCreateInput(
    validValues({
      chiefComplaint: "",
      examinationSummary: "   ",
      diagnosisSummary: "",
      notes: "\n\t ",
      patientInstructions: "",
      progressNotes: " ",
      appointmentId: "  ",
      treatmentId: "   ",
    }),
    "patient-a",
  );

  assert.ok("input" in result);
  assert.equal(result.input.chiefComplaint, null);
  assert.equal(result.input.examinationSummary, null);
  assert.equal(result.input.diagnosisSummary, null);
  assert.equal(result.input.notes, null);
  assert.equal(result.input.patientInstructions, null);
  assert.equal(result.input.progressNotes, null);
  assert.equal(result.input.appointmentId, undefined);
  assert.equal(result.input.treatmentId, undefined);
});

test("encounter create form: appendProcedure concatena y evita duplicados exactos", () => {
  const first = {
    targetType: "TOOTH",
    toothNumber: "16",
    description: "Obturación con resina",
    treatmentProcedureId: "treatment-procedure-corona",
  };
  const second = {
    targetType: "REGION",
    targetDescription: "Cuadrante superior derecho",
    description: "Profilaxis profesional",
  };

  const initial = appendProcedure([], [first]);
  assert.equal(initial.length, 1);

  const duplicated = appendProcedure(initial, [first]);
  assert.equal(duplicated.length, 1);
  assert.deepEqual(duplicated[0], first);

  const withNew = appendProcedure(initial, [second]);
  assert.equal(withNew.length, 2);
  assert.deepEqual(withNew[1], second);

  const withDuplicatesInBatch = appendProcedure([], [first, { ...first }, second]);
  assert.equal(withDuplicatesInBatch.length, 2);
});

test("encounter create form: appendProcedure conserva objetivos distintos con la misma descripción", () => {
  const regionA = {
    targetType: "REGION",
    targetDescription: "Cuadrante superior derecho",
    description: "Revisión",
  };
  const regionB = {
    ...regionA,
    targetDescription: "Cuadrante inferior izquierdo",
  };

  assert.equal(appendProcedure([], [regionA, regionB]).length, 2);
  assert.equal(appendProcedure([], [regionA, { ...regionA }]).length, 1);

  const otherA = {
    targetType: "OTHER",
    targetDescription: "Zona palatina",
    description: "Revisión",
  };
  const otherB = {
    ...otherA,
    targetDescription: "Zona lingual",
  };

  assert.equal(appendProcedure([], [otherA, otherB]).length, 2);
  assert.equal(appendProcedure([], [otherA, { ...otherA }]).length, 1);
});

test("encounter create form: removeProcedureAt elimina la fila indicada", () => {
  const first = {
    targetType: "TOOTH",
    toothNumber: "16",
    description: "Obturación con resina",
  };
  const second = {
    targetType: "WHOLE_MOUTH",
    description: "Profilaxis",
  };
  const third = {
    targetType: "OTHER",
    description: "Control",
  };

  const result = removeProcedureAt([first, second, third], 1);
  assert.deepEqual(result, [first, third]);
  assert.deepEqual(removeProcedureAt([first], 5), [first]);
});

test("encounter create form: describeProcedure incluye la pieza o el objetivo", () => {
  assert.equal(
    describeProcedure({
      targetType: "TOOTH",
      toothNumber: "16",
      description: "Obturación con resina",
    }),
    "Pieza 16 · Obturación con resina",
  );

  assert.equal(
    describeProcedure({
      targetType: "TOOTH",
      description: "Sellado",
    }),
    "Pieza dental · Sellado",
  );

  assert.equal(
    describeProcedure({
      targetType: "WHOLE_MOUTH",
      description: "Profilaxis",
    }),
    "Boca completa · Profilaxis",
  );

  assert.equal(
    describeProcedure({
      targetType: "REGION",
      targetDescription: "Cuadrante superior derecho",
      description: "Profilaxis",
    }),
    "Cuadrante superior derecho · Profilaxis",
  );

  assert.equal(
    describeProcedure({
      targetType: "OTHER",
      targetDescription: "Zona palatina",
      description: "Revisión",
    }),
    "Zona palatina · Revisión",
  );
});

test("encounter create form: no inventa un tratamiento para la cita", () => {
  const appointments = [
    { id: "appointment-control", label: "Cita de control" },
    { id: "appointment-linked", label: "Cita con plan", treatmentId: "treatment-ortho" },
  ];

  assert.equal(suggestedTreatmentId("appointment-control", appointments), null);
  assert.equal(suggestedTreatmentId("appointment-linked", appointments), "treatment-ortho");
  assert.equal(suggestedTreatmentId("", appointments), null);
});

test("encounter create form: el error parcial conserva encounterId, name y cause", () => {
  const cause = new Error("fallo al registrar procedimientos");
  const error = new ClinicalEncounterPartialCreateError(
    "La atención se creó, pero no se pudieron registrar los procedimientos.",
    "encounter-a",
    { cause },
  );

  assert.ok(error instanceof Error);
  assert.equal(error.name, "ClinicalEncounterPartialCreateError");
  assert.equal(error.encounterId, "encounter-a");
  assert.equal(error.message, "La atención se creó, pero no se pudieron registrar los procedimientos.");
  assert.equal(error.cause, cause);
});
