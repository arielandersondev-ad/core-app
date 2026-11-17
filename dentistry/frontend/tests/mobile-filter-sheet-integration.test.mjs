import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("HAG-36 Treatments.tsx: Integra MobileFilterSheet y FilterTriggerButton en modo móvil", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Treatments.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  // 1. Imports desde el barrel de UI
  assert.match(
    content,
    /MobileFilterSheet[\s\S]*?FilterTriggerButton/,
    "Treatments.tsx debe importar MobileFilterSheet y FilterTriggerButton",
  );

  // 2. Toolbar bimodal: desktop (hidden md:flex) y mobile (md:hidden)
  assert.match(
    content,
    /className="hidden md:flex items-center justify-between gap-3 w-full"/,
    "Treatments.tsx debe mantener la toolbar horizontal en desktop (hidden md:flex)",
  );
  assert.match(
    content,
    /className="md:hidden flex items-center gap-2 w-full"/,
    "Treatments.tsx debe presentar barra compacta de una fila en móvil (md:hidden)",
  );

  // 3. FilterTriggerButton con activeCount dinámico
  assert.match(
    content,
    /<FilterTriggerButton[\s\S]*?onClick=\{[\s\S]*?setIsFilterSheetOpen\(true\)[\s\S]*?activeCount=\{activeFilterCount\}/,
    "FilterTriggerButton debe abrir el sheet y mostrar activeFilterCount",
  );

  // 4. MobileFilterSheet con Categoría y Estado
  assert.match(
    content,
    /<MobileFilterSheet[\s\S]*?isOpen=\{isFilterSheetOpen\}[\s\S]*?title="Filtros de Tratamientos"[\s\S]*?onClear=\{[\s\S]*?setSelectedCategory\("all"\)[\s\S]*?setStatusFilter\("all"\)/,
    "MobileFilterSheet debe configurarse con title, onClear y onApply",
  );
});

test("HAG-36 Pacientes (patients-page.tsx): Integra MobileFilterSheet y FilterTriggerButton", () => {
  const filePath = path.resolve(__dirname, "../src/features/patient/views/patients-page.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  // 1. Imports
  assert.match(
    content,
    /MobileFilterSheet[\s\S]*?FilterTriggerButton/,
    "patients-page.tsx debe importar MobileFilterSheet y FilterTriggerButton",
  );

  // 2. Toolbar bimodal
  assert.match(
    content,
    /className="hidden md:flex items-center gap-3 w-full"/,
    "patients-page.tsx debe tener vista desktop en hidden md:flex",
  );
  assert.match(
    content,
    /className="md:hidden flex items-center gap-2 w-full"/,
    "patients-page.tsx debe tener vista móvil compacta en md:hidden",
  );

  // 3. FilterTriggerButton y Sheet
  assert.match(
    content,
    /<FilterTriggerButton[\s\S]*?activeCount=\{activeFilterCount\}/,
    "FilterTriggerButton en Pacientes debe estar conectado a activeFilterCount",
  );
  assert.match(
    content,
    /<MobileFilterSheet[\s\S]*?isOpen=\{isFilterSheetOpen\}[\s\S]*?title="Filtros de Pacientes"/,
    "MobileFilterSheet en Pacientes debe tener título 'Filtros de Pacientes'",
  );
});

test("HAG-36 Pagos (Payments.tsx): Integra MobileFilterSheet y FilterTriggerButton", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Payments.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  // 1. Imports
  assert.match(
    content,
    /MobileFilterSheet[\s\S]*?FilterTriggerButton/,
    "Payments.tsx debe importar MobileFilterSheet y FilterTriggerButton",
  );

  // 2. Toolbar bimodal
  assert.match(
    content,
    /className="hidden md:flex flex-wrap items-center gap-3 flex-1"/,
    "Payments.tsx debe conservar la vista desktop intacta",
  );
  assert.match(
    content,
    /className="md:hidden flex items-center justify-between gap-2 w-full"/,
    "Payments.tsx debe mostrar barra compacta en móvil",
  );

  // 3. Trigger & Sheet
  assert.match(
    content,
    /<FilterTriggerButton[\s\S]*?activeCount=\{activeFilterCount\}/,
    "FilterTriggerButton en Pagos debe reflejar activeFilterCount",
  );
  assert.match(
    content,
    /<MobileFilterSheet[\s\S]*?title="Filtros de Pagos"/,
    "MobileFilterSheet en Pagos debe configurarse con título 'Filtros de Pagos'",
  );
});

test("HAG-36 Inventario (Inventory.tsx): Integra MobileFilterSheet y FilterTriggerButton", () => {
  const filePath = path.resolve(__dirname, "../src/modules/clinic/views/Inventory.tsx");
  const content = fs.readFileSync(filePath, "utf8");

  // 1. Imports
  assert.match(
    content,
    /MobileFilterSheet[\s\S]*?FilterTriggerButton/,
    "Inventory.tsx debe importar MobileFilterSheet y FilterTriggerButton",
  );

  // 2. Toolbar bimodal
  assert.match(
    content,
    /className="hidden md:flex items-center justify-between gap-3 w-full"/,
    "Inventory.tsx debe mantener la toolbar desktop en hidden md:flex",
  );
  assert.match(
    content,
    /className="md:hidden flex items-center gap-2 w-full"/,
    "Inventory.tsx debe tener barra compacta en móvil (md:hidden)",
  );

  // 3. Trigger & Sheet
  assert.match(
    content,
    /<FilterTriggerButton[\s\S]*?activeCount=\{activeFilterCount\}/,
    "FilterTriggerButton en Inventario debe enlazar a activeFilterCount",
  );
  assert.match(
    content,
    /<MobileFilterSheet[\s\S]*?title="Filtros de Inventario"[\s\S]*?onClear=\{[\s\S]*?setSelectedCategory\("all"\)[\s\S]*?setFilter\("all"\)/,
    "MobileFilterSheet en Inventario debe restablecer categoría y filtro de stock",
  );
});
