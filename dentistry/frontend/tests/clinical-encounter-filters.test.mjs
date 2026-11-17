import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const {
  ALL_ENCOUNTER_STATUSES,
  buildListFilters,
  countRecordedProcedures,
  describeEncounterSubtitle,
  formatProcedureCount,
  hasActiveListFilters,
  normalizeSearch,
  truncateText,
} = load("src/features/clinical-encounter/utils/encounter-filters.ts");

test("Clinical encounter filters: normalizeSearch recorta y colapsa espacios", () => {
  assert.equal(normalizeSearch("  dolor   leve "), "dolor leve");
  assert.equal(normalizeSearch("\n caries \t oclusal \n"), "caries oclusal");
  assert.equal(normalizeSearch("   "), "");
  assert.equal(normalizeSearch(""), "");
});

test("Clinical encounter filters: una búsqueda vacía no se envía", () => {
  assert.deepEqual(buildListFilters({ search: "" }), {});
  assert.deepEqual(buildListFilters({ search: "   " }), {});
  assert.deepEqual(buildListFilters({ search: "\n\t " }), {});
});

test("Clinical encounter filters: la búsqueda se recorta antes de enviarse", () => {
  assert.deepEqual(buildListFilters({ search: "  caries  " }), { search: "caries" });
  assert.deepEqual(buildListFilters({ search: "dolor   leve" }), { search: "dolor leve" });
});

test("Clinical encounter filters: el estado ALL se omite", () => {
  assert.deepEqual(buildListFilters({ status: ALL_ENCOUNTER_STATUSES }), {});
  assert.deepEqual(
    buildListFilters({ status: ALL_ENCOUNTER_STATUSES, search: "  control " }),
    { search: "control" },
  );
});

test("Clinical encounter filters: combina estado y búsqueda normalizada", () => {
  assert.deepEqual(
    buildListFilters({ status: "COMPLETED", search: "  obturación  " }),
    { status: "COMPLETED", search: "obturación" },
  );
  assert.deepEqual(buildListFilters({ status: "VOIDED" }), { status: "VOIDED" });
});

test("Clinical encounter filters: no inventa paginación", () => {
  const filters = buildListFilters({ status: "IN_PROGRESS", search: "control" });

  assert.equal("page" in filters, false);
  assert.equal("pageSize" in filters, false);
  assert.equal(filters.page, undefined);
  assert.equal(filters.pageSize, undefined);
});

test("Clinical encounter filters: hasActiveListFilters distingue filtros activos", () => {
  assert.equal(hasActiveListFilters({ status: ALL_ENCOUNTER_STATUSES, search: "  " }), false);
  assert.equal(hasActiveListFilters({ status: "ALL" }), false);
  assert.equal(hasActiveListFilters({ status: "COMPLETED" }), true);
  assert.equal(hasActiveListFilters({ search: "caries" }), true);
});

test("Clinical encounter filters: describeEncounterSubtitle prioriza motivo y examen", () => {
  assert.equal(
    describeEncounterSubtitle({
      chiefComplaint: "  Dolor en 16  ",
      examinationSummary: "Caries oclusal",
      procedureSummary: "Obturación",
    }),
    "Dolor en 16",
  );

  assert.equal(
    describeEncounterSubtitle({
      chiefComplaint: "   ",
      examinationSummary: "  Caries oclusal  ",
      procedureSummary: "Obturación",
    }),
    "Caries oclusal",
  );

  assert.equal(
    describeEncounterSubtitle({
      chiefComplaint: null,
      examinationSummary: null,
      procedureSummary: "  Profilaxis  ",
    }),
    "Profilaxis",
  );

  assert.equal(
    describeEncounterSubtitle({
      chiefComplaint: null,
      examinationSummary: undefined,
      procedureSummary: null,
    }),
    "",
  );
});

test("Clinical encounter filters: truncateText respeta el máximo y añade elipsis", () => {
  assert.equal(truncateText("dolor leve", 120), "dolor leve");
  assert.equal(truncateText("  dolor   leve  ", 20), "dolor leve");
  assert.equal(truncateText("dolor leve", 6), "dolor…");
  assert.equal(truncateText("", 10), "");
});

test("Clinical encounter filters: procedimientos vigentes y etiqueta plural", () => {
  assert.equal(
    countRecordedProcedures([
      { status: "RECORDED" },
      { status: "VOIDED" },
      { status: "RECORDED" },
    ]),
    2,
  );
  assert.equal(countRecordedProcedures([]), 0);

  assert.equal(formatProcedureCount(0), "Sin procedimientos");
  assert.equal(formatProcedureCount(1), "1 procedimiento");
  assert.equal(formatProcedureCount(3), "3 procedimientos");
});
