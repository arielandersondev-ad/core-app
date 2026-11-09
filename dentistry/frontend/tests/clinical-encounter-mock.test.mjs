import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const { createClinicalEncounterMockDataSource } = load(
  "src/features/clinical-encounter/services/clinical-encounter.mock.ts",
);
const { ClinicalEncounterStateError } = load(
  "src/features/clinical-encounter/services/clinical-encounter.error.ts",
);

const source = createClinicalEncounterMockDataSource();

function createInput(patientId, appointmentId) {
  return {
    patientId,
    branchId: "branch-centro",
    appointmentId,
    startedAt: "2026-11-08T09:00:00.000Z",
  };
}

test("Clinical encounter mock: complete rechaza VOIDED y no permite completar dos veces", async () => {
  const patientId = "mock-complete-state";
  const encounters = await source.list(patientId);
  const voided = encounters.find((encounter) => encounter.status === "VOIDED");
  const inProgress = encounters.find((encounter) => encounter.status === "IN_PROGRESS");

  assert.ok(voided);
  assert.ok(inProgress);

  await assert.rejects(
    source.complete(patientId, voided.id, { endedAt: "2020-01-01T00:00:00.000Z" }),
    ClinicalEncounterStateError,
  );

  await source.complete(patientId, inProgress.id, { endedAt: "2020-01-01T00:00:00.000Z" });

  await assert.rejects(
    source.complete(patientId, inProgress.id, { endedAt: "2020-01-02T00:00:00.000Z" }),
    ClinicalEncounterStateError,
  );
});

test("Clinical encounter mock: addProcedures rechaza atenciones COMPLETED", async () => {
  const patientId = "mock-add-procedures-state";
  const [completed] = await source.list(patientId, { status: "COMPLETED" });

  await assert.rejects(
    source.addProcedures(patientId, completed.id, [
      { targetType: "TOOTH", toothNumber: "16", description: "Obturación" },
    ]),
    ClinicalEncounterStateError,
  );
});

test("Clinical encounter mock: create rechaza appointmentId duplicado no anulado", async () => {
  const patientId = "mock-appointment-duplicate";

  await assert.rejects(
    source.create(createInput(patientId, "appointment-control")),
    ClinicalEncounterStateError,
  );
});

test("Clinical encounter mock: void exige motivo, asigna actor y rechaza reanulación", async () => {
  const patientId = "mock-void-state";
  const encounters = await source.list(patientId);
  const inProgress = encounters.find((encounter) => encounter.status === "IN_PROGRESS");

  assert.ok(inProgress);

  await assert.rejects(
    source.void(patientId, inProgress.id, { reason: "   " }),
    ClinicalEncounterStateError,
  );

  const voided = await source.void(patientId, inProgress.id, {
    reason: "  Paciente solicita anulación  ",
  });

  assert.equal(voided.status, "VOIDED");
  assert.equal(voided.voidReason, "Paciente solicita anulación");
  assert.equal(voided.voidedByMembershipId, voided.practitionerMembershipId);
  assert.ok(voided.voidedAt);

  await assert.rejects(
    source.void(patientId, inProgress.id, { reason: "Segundo intento" }),
    ClinicalEncounterStateError,
  );
});

test("Clinical encounter mock: void permite anular una atención COMPLETED", async () => {
  const patientId = "mock-void-completed";
  const [completed] = await source.list(patientId, { status: "COMPLETED" });

  const voided = await source.void(patientId, completed.id, {
    reason: "Corrección administrativa",
  });

  assert.equal(voided.status, "VOIDED");
  assert.equal(voided.voidedByMembershipId, voided.practitionerMembershipId);
});

test("Clinical encounter mock: completedAt es un cierre propio y difiere de endedAt", async () => {
  const patientId = "mock-completed-at";
  const encounters = await source.list(patientId);
  const seededCompleted = encounters.find((encounter) => encounter.status === "COMPLETED");
  const inProgress = encounters.find((encounter) => encounter.status === "IN_PROGRESS");

  assert.ok(seededCompleted);
  assert.ok(inProgress);
  assert.notEqual(seededCompleted.completedAt, seededCompleted.endedAt);

  const endedAt = "2020-01-01T00:00:00.000Z";
  const completed = await source.complete(patientId, inProgress.id, { endedAt });

  assert.equal(completed.status, "COMPLETED");
  assert.equal(completed.endedAt, endedAt);
  assert.notEqual(completed.completedAt, endedAt);
  assert.equal(completed.completedByMembershipId, completed.practitionerMembershipId);
});

test("Clinical encounter mock: devuelve copias defensivas de las atenciones", async () => {
  const patientId = "mock-defensive-copies";
  const [completed] = await source.list(patientId, { status: "COMPLETED" });
  const first = await source.get(patientId, completed.id);
  const originalLength = first.procedures.length;
  const originalDescription = first.procedures[0].description;
  const originalSummary = first.procedureSummary;

  first.procedures.push({
    id: "mutated",
    clinicalEncounterId: first.id,
    targetType: "TOOTH",
    toothNumber: "16",
    description: "Mutado",
    status: "RECORDED",
  });
  first.procedures[0].description = "Mutado";
  first.procedureSummary = "Mutado";

  const second = await source.get(patientId, completed.id);

  assert.equal(second.procedures.length, originalLength);
  assert.equal(second.procedures[0].description, originalDescription);
  assert.equal(second.procedureSummary, originalSummary);
});

test("Clinical encounter mock: la búsqueda incluye motivo, notas y descripciones de procedimientos", async () => {
  const patientId = "mock-search-haystack";

  const byChiefComplaint = await source.list(patientId, { search: "registro duplicado" });
  assert.equal(byChiefComplaint.length, 1);
  assert.equal(byChiefComplaint[0].status, "VOIDED");
  assert.match(byChiefComplaint[0].chiefComplaint, /Registro duplicado/i);

  const byProcedure = await source.list(patientId, { search: "resina compuesta" });
  assert.equal(byProcedure.length, 1);
  assert.equal(byProcedure[0].status, "COMPLETED");

  const byNotes = await source.list(patientId, { search: "sin incidencias" });
  assert.equal(byNotes.length, 1);
  assert.equal(byNotes[0].status, "COMPLETED");
});
