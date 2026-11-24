import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  isModuleEnabled,
  isSessionPlan,
  moduleForPath,
} from "../src/shared/plan/plan-access.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASIC = {
  modules: ["patients", "agenda", "appointments", "procedures"],
  limits: { patients: 300, members: 2, branches: 1 },
};

test("Plan: habilita solo los módulos incluidos", () => {
  assert.equal(isModuleEnabled(BASIC, "agenda"), true);
  assert.equal(isModuleEnabled(BASIC, "payments"), false);
  assert.equal(isModuleEnabled({ ...BASIC, modules: null }, "payments"), true);
  assert.equal(isModuleEnabled(null, "agenda"), false);
});

test("Plan: asocia rutas de plataforma a su módulo", () => {
  assert.equal(moduleForPath("/dashboard"), "dashboard");
  assert.equal(moduleForPath("/patients/abc/clinical-encounters"), "patients");
  assert.equal(moduleForPath("/register-payment"), "payments");
  assert.equal(moduleForPath("/inventory"), "inventory");
  assert.equal(moduleForPath("/patientsx"), null);
  assert.equal(moduleForPath("/login"), null);
});

test("Plan: valida el bloque plan de /auth/me", () => {
  assert.equal(isSessionPlan(BASIC), true);
  assert.equal(isSessionPlan(null), true);
  assert.equal(isSessionPlan({ modules: null, limits: { patients: null, members: null, branches: null } }), true);
  assert.equal(isSessionPlan(undefined), false);
  assert.equal(isSessionPlan({ modules: "x", limits: BASIC.limits }), false);
  assert.equal(isSessionPlan({ modules: null, limits: { patients: 0, members: null, branches: null } }), false);
  assert.equal(isSessionPlan({ modules: null, limits: { patients: 300, users: 2, branches: 1 } }), false);
});

test("Plan: la navegación y el shell filtran por plan", () => {
  const read = (file) => fs.readFileSync(path.join(root, "src/shared/components/layout", file), "utf8");
  assert.match(read("app-sidebar.tsx"), /navItemsForPlan\(plan\)/);
  assert.match(read("bottom-nav.tsx"), /navItemsForPlan\(plan\)/);
  assert.match(read("app-shell.tsx"), /<ModuleGate>/);
  const navigation = read("navigation.ts");
  for (const code of ["dashboard", "patients", "agenda", "services", "inventory"]) {
    assert.match(navigation, new RegExp(`module: "${code}"`));
  }
  // Tratamientos y pagos viven en la cuenta del paciente, no como secciones globales del menú.
  for (const code of ["treatments", "payments"]) {
    assert.doesNotMatch(navigation, new RegExp(`module: "${code}"`));
  }
});
