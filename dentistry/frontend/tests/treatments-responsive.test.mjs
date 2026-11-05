import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("HAG-24 Treatments.tsx: Resumen compacto en móvil y StatCards en desktop", () => {
  const treatmentsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Treatments.tsx",
  );
  const content = fs.readFileSync(treatmentsPath, "utf8");

  // 1. CompactStatSummary para viewport móvil (< 1024px / lg:hidden)
  assert.match(
    content,
    /<CompactStatSummary[\s\S]*?items=\{compactMetrics\}/,
    "Debe renderizar CompactStatSummary con las 4 micro-métricas en móvil",
  );
  assert.match(
    content,
    /className="lg:hidden"/,
    "CompactStatSummary debe mostrarse en móvil/tablet y ocultarse en desktop grande",
  );

  // 2. StatCards tradicionales en desktop (hidden lg:grid)
  assert.match(
    content,
    /hidden\s+lg:grid\s+grid-cols-4/,
    "Debe mantener los 4 StatCards tradicionales en desktop (>= 1024px)",
  );
});

test("HAG-24 Treatments.tsx: Listado en móvil con tarjetas <article> y tabla en desktop", () => {
  const treatmentsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Treatments.tsx",
  );
  const content = fs.readFileSync(treatmentsPath, "utf8");

  // Tarjetas móviles (< 768px / md:hidden)
  assert.match(
    content,
    /className="md:hidden\s+flex\s+flex-col\s+gap-3"/,
    "Debe tener contenedor específico para móvil (< 768px)",
  );
  assert.match(
    content,
    /<article[\s\S]*?className="rounded-xl border border-\[var\(--border\)\] bg-\[var\(--surface\)\]/,
    "Debe renderizar elementos <article> estilizados para cada tratamiento",
  );
  assert.match(
    content,
    /font-display font-semibold text-\[var\(--foreground\)\]/,
    "El nombre del servicio debe estar destacado en negrita",
  );
  assert.match(
    content,
    /leading-relaxed/,
    "La descripción debe tener interlineado legible (leading-relaxed)",
  );
  assert.match(
    content,
    /⏱[\s\S]*?\{svc\.durationMin\}\s*min/,
    "Debe mostrar la duración con icono de reloj",
  );
  assert.match(
    content,
    /formatCurrency\(svc\.price\)/,
    "Debe mostrar el precio destacado con formatCurrency",
  );
  assert.match(
    content,
    /Editar/,
    "Debe incluir botón accesible de Editar en cada tarjeta",
  );
  assert.match(
    content,
    /Eliminar/,
    "Debe incluir botón accesible de Eliminar en cada tarjeta",
  );

  // Tabla desktop (>= 768px / hidden md:block)
  assert.match(
    content,
    /hidden\s+md:block/,
    "Debe contener la tabla tradicional oculta en móvil y visible en desktop",
  );
  assert.match(
    content,
    /<table/,
    "Debe contener la etiqueta <table> en el contenedor desktop",
  );
});

test("HAG-24 Treatments.tsx: Scroll infinito e IntersectionObserver con resiliencia de filtros", () => {
  const treatmentsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Treatments.tsx",
  );
  const content = fs.readFileSync(treatmentsPath, "utf8");

  // IntersectionObserver y centinela
  assert.match(
    content,
    /new\s+IntersectionObserver/,
    "Debe inicializar un IntersectionObserver para scroll infinito",
  );
  assert.match(
    content,
    /ref=\{sentinelRef\}/,
    "Debe vincular el centinela al final del listado",
  );
  assert.match(
    content,
    /animate-spin/,
    "Debe mostrar un spinner discreto mientras carga el siguiente lote",
  );

  // Resiliencia de filtros (reset a página 1)
  assert.match(
    content,
    /setPage\(1\)/,
    "Debe reiniciar a página 1 cuando los filtros cambian",
  );
  assert.match(
    content,
    /PAGE_SIZE\s*=\s*15/,
    "Debe usar lote de 15 por página",
  );
});

test("HAG-24 services.ts: Contrato de paginación para scroll infinito", () => {
  const servicesPath = path.resolve(
    __dirname,
    "../src/modules/clinic/api/services.ts",
  );
  const content = fs.readFileSync(servicesPath, "utf8");

  assert.match(
    content,
    /export interface PaginatedDentalServicesResponse/,
    "Debe exportar PaginatedDentalServicesResponse",
  );
  assert.match(
    content,
    /items:\s*DentalServiceDto\[\]/,
    "El contrato paginado debe contener items",
  );
  assert.match(
    content,
    /total:\s*number/,
    "El contrato paginado debe contener total",
  );
  assert.match(
    content,
    /hasMore:\s*boolean/,
    "El contrato paginado debe contener hasMore",
  );
  assert.match(
    content,
    /export async function fetchDentalServicesPaginated/,
    "Debe exportar fetchDentalServicesPaginated",
  );
});
