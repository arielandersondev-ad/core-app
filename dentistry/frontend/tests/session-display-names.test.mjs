import assert from "node:assert/strict";
import test from "node:test";
import { createSourceLoader } from "./support/load-source.mjs";

const load = createSourceLoader();
const { organizationDisplayName, userFirstName, FALLBACK_ORGANIZATION_NAME } = load(
  "src/shared/session/display-names.ts",
);

test("nombre de la organización con respaldo cuando Core no lo informa", () => {
  assert.equal(organizationDisplayName({ context: { organizationName: "  Clínica Sonrisa " } }), "Clínica Sonrisa");
  for (const organizationName of [undefined, null, "", "   "]) {
    assert.equal(organizationDisplayName({ context: { organizationName } }), FALLBACK_ORGANIZATION_NAME);
  }
});

test("el saludo usa solo el primer nombre del usuario", () => {
  assert.equal(userFirstName({ user: { id: "u", firstName: "María José", lastName: "Rojas" } }), "María");
  assert.equal(userFirstName({ user: { id: "u", firstName: " Ana " } }), "Ana");
  assert.equal(userFirstName({ user: { id: "u", firstName: null } }), null);
  assert.equal(userFirstName({ user: { id: "u" } }), null);
});
