import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("HAG-55 Barrel UI: Re-exporta PullToRefresh, usePullToRefresh y tipos asociados", () => {
  const barrelPath = path.resolve(__dirname, "../src/shared/components/ui/index.ts");
  const content = fs.readFileSync(barrelPath, "utf8");

  assert.match(content, /\bPullToRefresh\b/, "Debe re-exportar PullToRefresh");
  assert.match(content, /\busePullToRefresh\b/, "Debe re-exportar usePullToRefresh");
  assert.match(content, /\bPullToRefreshProps\b/, "Debe re-exportar PullToRefreshProps");
  assert.match(content, /\bPullToRefreshState\b/, "Debe re-exportar PullToRefreshState");
  assert.match(content, /\bUsePullToRefreshOptions\b/, "Debe re-exportar UsePullToRefreshOptions");
  assert.match(content, /\bUsePullToRefreshReturn\b/, "Debe re-exportar UsePullToRefreshReturn");
});

test("HAG-55 Agenda.tsx: Integra PullToRefresh con handleRefreshAppointments", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Agenda.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  assert.match(content, /import\s*\{[^}]*PullToRefresh[^}]*\}\s*from\s*["']@\/shared\/components\/ui["']/, "Debe importar PullToRefresh");
  assert.match(content, /handleRefreshAppointments/, "Debe definir handleRefreshAppointments");
  assert.match(content, /<PullToRefresh\s+onRefresh=\{handleRefreshAppointments\}/, "Debe envolver el feed con PullToRefresh");
  assert.match(content, /fetchAppointments\(\{\s*date\s*\}\)/, "handleRefreshAppointments debe recargar citas por fecha");
});

test("HAG-55 Treatments.tsx: Integra PullToRefresh con handleRefresh", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Treatments.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  assert.match(content, /import\s*\{[^}]*PullToRefresh[^}]*\}\s*from\s*["']@\/shared\/components\/ui["']/, "Debe importar PullToRefresh");
  assert.match(content, /handleRefresh/, "Debe definir handleRefresh");
  assert.match(content, /<PullToRefresh\s+onRefresh=\{handleRefresh\}/, "Debe envolver el catálogo con PullToRefresh");
  assert.match(content, /loadPage\(1,\s*true\)/, "handleRefresh debe recargar desde la página 1");
});

test("HAG-55 patients-page.tsx: Integra PullToRefresh con handleRefresh", () => {
  const filePath = path.resolve(__dirname, "../src/features/patient/views/patients-page.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  assert.match(content, /import\s*\{[^}]*PullToRefresh[^}]*\}\s*from\s*["']@\/shared\/components\/ui["']/, "Debe importar PullToRefresh");
  assert.match(content, /handleRefresh/, "Debe definir handleRefresh");
  assert.match(content, /<PullToRefresh\s+onRefresh=\{handleRefresh\}/, "Debe envolver el listado de pacientes con PullToRefresh");
  assert.match(content, /query\.refetch\(\)/, "handleRefresh debe invocar query.refetch()");
});

test("HAG-55 Payments.tsx: Integra PullToRefresh con handleRefresh", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Payments.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  assert.match(content, /import\s*\{[^}]*PullToRefresh[^}]*\}\s*from\s*["']@\/shared\/components\/ui["']/, "Debe importar PullToRefresh");
  assert.match(content, /handleRefresh/, "Debe definir handleRefresh");
  assert.match(content, /<PullToRefresh\s+onRefresh=\{handleRefresh\}/, "Debe envolver el listado de pagos con PullToRefresh");
});

test("HAG-55 Inventory.tsx: Integra PullToRefresh con handleRefresh", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Inventory.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  assert.match(content, /import\s*\{[^}]*PullToRefresh[^}]*\}\s*from\s*["']@\/shared\/components\/ui["']/, "Debe importar PullToRefresh");
  assert.match(content, /handleRefresh/, "Debe definir handleRefresh");
  assert.match(content, /<PullToRefresh\s+onRefresh=\{handleRefresh\}/, "Debe envolver el inventario con PullToRefresh");
});
