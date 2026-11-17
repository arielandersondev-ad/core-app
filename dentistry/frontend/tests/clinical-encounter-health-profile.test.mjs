import { test } from "node:test";
import assert from "node:assert/strict";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();

const {
  HEALTH_PROFILE_FIELDS,
  canEditHealthProfile,
  canReadHealthProfile,
  isDraftDirty,
  shouldResetDraft,
  toHealthProfileDraft,
  toHealthProfileInput,
} = load("src/features/clinical-encounter/utils/health-profile-form.ts");
const { DEV_PERSONAS } = load("src/features/dev-auth/types/personas.ts");

const emptyProfile = {
  patientId: "patient-1",
  medicalHistory: null,
  allergies: null,
  currentMedications: null,
  dentalHistory: null,
  relevantConditions: null,
  observations: null,
};

const filledProfile = {
  patientId: "patient-1",
  medicalHistory: "Hipertensión controlada.",
  allergies: "Penicilina.",
  currentMedications: "Losartán 50 mg.",
  dentalHistory: "Ortodoncia finalizada en 2021.",
  relevantConditions: "Bruxismo nocturno.",
  observations: "Prefiere citas matutinas.",
  updatedAt: "2026-10-28T14:20:00.000Z",
  rowVersion: 1,
};

test("health profile: toHealthProfileDraft convierte null en cadena vacía", () => {
  assert.deepEqual(toHealthProfileDraft(emptyProfile), {
    medicalHistory: "",
    allergies: "",
    currentMedications: "",
    dentalHistory: "",
    relevantConditions: "",
    observations: "",
  });

  assert.deepEqual(toHealthProfileDraft(filledProfile), {
    medicalHistory: "Hipertensión controlada.",
    allergies: "Penicilina.",
    currentMedications: "Losartán 50 mg.",
    dentalHistory: "Ortodoncia finalizada en 2021.",
    relevantConditions: "Bruxismo nocturno.",
    observations: "Prefiere citas matutinas.",
  });
});

test("health profile: toHealthProfileInput normaliza vacíos y recorta los valores", () => {
  const input = toHealthProfileInput({
    medicalHistory: "  Hipertensión controlada.  ",
    allergies: "   ",
    currentMedications: "",
    dentalHistory: "Ortodoncia\nfinalizada en 2021.",
    relevantConditions: "\tBruxismo nocturno.\n",
    observations: "\n\n",
  });

  assert.deepEqual(input, {
    medicalHistory: "Hipertensión controlada.",
    allergies: null,
    currentMedications: null,
    dentalHistory: "Ortodoncia\nfinalizada en 2021.",
    relevantConditions: "Bruxismo nocturno.",
    observations: null,
  });
});

test("health profile: isDraftDirty compara valores normalizados", () => {
  const draft = toHealthProfileDraft(filledProfile);

  assert.equal(isDraftDirty(draft, filledProfile), false);
  assert.equal(
    isDraftDirty({ ...draft, allergies: `  ${filledProfile.allergies}  ` }, filledProfile),
    false,
  );

  assert.equal(isDraftDirty({ ...draft, allergies: "Látex." }, filledProfile), true);
  assert.equal(isDraftDirty({ ...draft, observations: "" }, filledProfile), true);

  const emptyDraft = toHealthProfileDraft(emptyProfile);
  assert.equal(isDraftDirty(emptyDraft, emptyProfile), false);
  assert.equal(isDraftDirty({ ...emptyDraft, medicalHistory: "Asma." }, emptyProfile), true);
});

test("health profile: HEALTH_PROFILE_FIELDS declara las seis claves exactas", () => {
  assert.deepEqual(
    HEALTH_PROFILE_FIELDS.map((field) => field.key),
    [
      "medicalHistory",
      "allergies",
      "currentMedications",
      "dentalHistory",
      "relevantConditions",
      "observations",
    ],
  );

  for (const field of HEALTH_PROFILE_FIELDS) {
    assert.equal(typeof field.label, "string");
    assert.ok(field.label.length > 0);
  }
});

test("health profile: permisos clínicos según las personas reales", () => {
  const owner = DEV_PERSONAS.owner.permissions;
  const practitioner = DEV_PERSONAS.practitioner.permissions;
  const reception = DEV_PERSONAS.reception.permissions;

  assert.equal(canReadHealthProfile(owner), true);
  assert.equal(canEditHealthProfile(owner), true);

  assert.equal(canReadHealthProfile(practitioner), true);
  assert.equal(canEditHealthProfile(practitioner), true);

  assert.equal(canReadHealthProfile(reception), false);
  assert.equal(canEditHealthProfile(reception), false);

  // Los permisos de filiación del paciente no habilitan el perfil clínico.
  assert.equal(canReadHealthProfile(["dentistry:patients:read"]), false);
  assert.equal(canEditHealthProfile(["dentistry:patients:update"]), false);
});

test("health profile: shouldResetDraft solo reinicia al cambiar la versión guardada", () => {
  assert.equal(shouldResetDraft(null, "v1"), true);
  assert.equal(shouldResetDraft("v1", "v2"), true);
  assert.equal(shouldResetDraft("v1", "v1"), false);
  assert.equal(shouldResetDraft(null, null), false);
  assert.equal(shouldResetDraft("v1", null), false);
});
