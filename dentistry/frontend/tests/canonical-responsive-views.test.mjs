import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("HAG-28 Pacientes: Bimodal KPIs, tarjetas móviles con tel: clickeable, tabla desktop y scroll infinito", () => {
  const pagePath = path.resolve(
    __dirname,
    "../src/features/patient/views/patients-page.tsx",
  );
  const tablePath = path.resolve(
    __dirname,
    "../src/features/patient/components/patient-table.tsx",
  );
  const pageContent = fs.readFileSync(pagePath, "utf8");
  const tableContent = fs.readFileSync(tablePath, "utf8");

  // 1. KPIs bimodales
  assert.match(
    pageContent,
    /<CompactStatSummary[\s\S]*?items=\{compactMetrics\}/,
    "Pacientes debe renderizar CompactStatSummary en móvil",
  );
  assert.match(
    pageContent,
    /className="lg:hidden"/,
    "CompactStatSummary de Pacientes debe ocultarse en desktop grande",
  );
  assert.match(
    pageContent,
    /hidden\s+lg:grid\s+grid-cols-3/,
    "Pacientes debe mantener StatCards en desktop (>= 1024px)",
  );

  // 2. Tarjetas móviles y tabla desktop en patient-table.tsx
  assert.match(
    tableContent,
    /<article[\s\S]*?className="rounded-xl border border-border bg-surface/,
    "Debe renderizar tarjetas móviles <article>",
  );
  assert.match(
    tableContent,
    /href=\{`tel:\$\{patient\.phone\}`\}/,
    "El teléfono del paciente debe ser un link clickeable tel:",
  );
  assert.match(
    tableContent,
    /hidden\s+md:block/,
    "Debe conservar la tabla tradicional completa en desktop",
  );
  assert.match(
    tableContent,
    /<table/,
    "Debe incluir etiqueta <table> en el contenedor de escritorio",
  );

  // 3. Scroll infinito
  assert.match(
    pageContent,
    /new\s+IntersectionObserver/,
    "Pacientes debe implementar IntersectionObserver para scroll infinito",
  );
  assert.match(
    pageContent,
    /ref=\{sentinelRef\}/,
    "Pacientes debe tener centinela para carga progresiva",
  );
  assert.match(
    pageContent,
    /animate-spin/,
    "Pacientes debe mostrar spinner discreto durante carga de siguiente lote",
  );
});

test("HAG-28 Pagos: Bimodal KPIs, tarjetas móviles <article>, tabla desktop y scroll infinito", () => {
  const paymentsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Payments.tsx",
  );
  const content = fs.readFileSync(paymentsPath, "utf8");

  // 1. KPIs bimodales
  assert.match(
    content,
    /<CompactStatSummary[\s\S]*?items=\{compactMetrics\}/,
    "Pagos debe renderizar CompactStatSummary en móvil",
  );
  assert.match(
    content,
    /className="lg:hidden"/,
    "CompactStatSummary de Pagos debe ocultarse en desktop grande",
  );
  assert.match(
    content,
    /hidden\s+lg:grid\s+grid-cols-4/,
    "Pagos debe mantener los StatCards en desktop (>= 1024px)",
  );

  // 2. Tarjetas móviles <article> y tabla desktop
  assert.match(
    content,
    /<article[\s\S]*?className="rounded-xl border border-\[var\(--border\)\] bg-\[var\(--surface\)\]/,
    "Pagos debe renderizar tarjetas móviles <article> limpias",
  );
  assert.match(
    content,
    /hidden\s+md:block/,
    "Pagos debe mantener la tabla desktop oculta en móvil",
  );
  assert.match(
    content,
    /<table/,
    "Pagos debe incluir etiqueta <table> para vista desktop",
  );

  // 3. Scroll infinito
  assert.match(
    content,
    /new\s+IntersectionObserver/,
    "Pagos debe implementar IntersectionObserver",
  );
  assert.match(
    content,
    /ref=\{sentinelRef\}/,
    "Pagos debe vincular centinela al final de la lista",
  );
  assert.match(
    content,
    /PAGE_SIZE\s*=\s*15/,
    "Pagos debe paginar por lotes de 15",
  );
});

test("HAG-28 Inventario: Bimodal KPIs, tarjetas móviles <article>, tabla desktop y scroll infinito", () => {
  const inventoryPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Inventory.tsx",
  );
  const content = fs.readFileSync(inventoryPath, "utf8");

  // 1. KPIs bimodales
  assert.match(
    content,
    /<CompactStatSummary[\s\S]*?items=\{compactMetrics\}/,
    "Inventario debe renderizar CompactStatSummary interactivo en móvil",
  );
  assert.match(
    content,
    /className="lg:hidden"/,
    "CompactStatSummary de Inventario debe ocultarse en desktop grande",
  );
  assert.match(
    content,
    /hidden\s+lg:grid\s+grid-cols-4/,
    "Inventario debe mantener los 4 StatCards en desktop (>= 1024px)",
  );

  // 2. Tarjetas móviles <article> y tabla desktop
  assert.match(
    content,
    /<article[\s\S]*?className="rounded-xl border border-\[var\(--border\)\] bg-\[var\(--surface\)\]/,
    "Inventario debe renderizar tarjetas móviles <article> estilizadas",
  );
  assert.match(
    content,
    /hidden\s+md:block/,
    "Inventario debe mantener la tabla desktop oculta en móvil",
  );
  assert.match(
    content,
    /<table/,
    "Inventario debe incluir etiqueta <table> para vista desktop",
  );

  // 3. Scroll infinito
  assert.match(
    content,
    /new\s+IntersectionObserver/,
    "Inventario debe implementar IntersectionObserver",
  );
  assert.match(
    content,
    /ref=\{sentinelRef\}/,
    "Inventario debe vincular centinela al final de la lista",
  );
  assert.match(
    content,
    /PAGE_SIZE\s*=\s*15/,
    "Inventario debe paginar por lotes de 15",
  );
});
