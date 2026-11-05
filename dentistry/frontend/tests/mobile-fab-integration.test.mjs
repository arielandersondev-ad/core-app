import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test("HAG-32 Agenda.tsx: Reemplaza FAB simple por MobileFloatingActionMenu con 3 acciones rápidas (Nueva Cita, Nuevo Paciente, Cobro Rápido)", () => {
  const agendaPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Agenda.tsx",
  );
  const content = fs.readFileSync(agendaPath, "utf8");

  assert.match(
    content,
    /MobileFloatingActionMenu/,
    "Agenda.tsx debe importar y renderizar MobileFloatingActionMenu",
  );
  assert.match(
    content,
    /className="md:hidden"/,
    "Debe aplicar md:hidden para desaparecer en desktop",
  );
  assert.match(
    content,
    /label:\s*"Nueva Cita"[\s\S]*?setIsCreateApptOpen\(true\)/,
    "Debe incluir acción 'Nueva Cita' que abre CreateAppointmentModal",
  );
  assert.match(
    content,
    /label:\s*"Nuevo Paciente"[\s\S]*?setIsCreatePatientOpen\(true\)/,
    "Debe incluir acción 'Nuevo Paciente' que abre CreatePatientModal",
  );
  assert.match(
    content,
    /label:\s*"Cobro Rápido"[\s\S]*?setPaymentModalState\(\{\s*open:\s*true\s*\}\)/,
    "Debe incluir acción 'Cobro Rápido' que abre RegisterPaymentModal",
  );
  assert.match(
    content,
    /<CreatePatientModal[\s\S]*?open=\{isCreatePatientOpen\}/,
    "Agenda.tsx debe montar CreatePatientModal controlado por isCreatePatientOpen",
  );
  assert.doesNotMatch(
    content,
    /aria-label="Nueva cita rápida"/,
    "No debe quedar el botón flotante simple antiguo en Agenda.tsx",
  );
});

test("HAG-32 Pacientes (patients-page.tsx y Patients.tsx): Integra MobileFloatingActionMenu (md:hidden) con acción 'Nuevo Paciente'", () => {
  const patientsPagePath = path.resolve(
    __dirname,
    "../src/features/patient/views/patients-page.tsx",
  );
  const clinicPatientsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Patients.tsx",
  );
  const createBtnPath = path.resolve(
    __dirname,
    "../src/features/patient/components/create-patient-button.tsx",
  );

  const pageContent = fs.readFileSync(patientsPagePath, "utf8");
  const clinicContent = fs.readFileSync(clinicPatientsPath, "utf8");
  const btnContent = fs.readFileSync(createBtnPath, "utf8");

  assert.match(
    pageContent,
    /<MobileFloatingActionMenu[\s\S]*?className="md:hidden"/,
    "patients-page.tsx debe incluir MobileFloatingActionMenu con md:hidden",
  );
  assert.match(
    pageContent,
    /label:\s*"Nuevo Paciente"[\s\S]*?setIsCreatePatientOpen\(true\)/,
    "patients-page.tsx debe tener la acción 'Nuevo Paciente' vinculada al modal de creación",
  );
  assert.match(
    btnContent,
    /className="hidden md:inline-flex"/,
    "El botón de cabecera de Nuevo paciente se preserva en desktop (hidden md:inline-flex)",
  );
  assert.match(
    clinicContent,
    /<MobileFloatingActionMenu[\s\S]*?label:\s*"Nuevo Paciente"/,
    "Patients.tsx también debe integrar MobileFloatingActionMenu con 'Nuevo Paciente'",
  );
});

test("HAG-32 Tratamientos (Treatments.tsx): Integra MobileFloatingActionMenu (md:hidden) con acción 'Nuevo Servicio'", () => {
  const treatmentsPath = path.resolve(
    __dirname,
    "../src/modules/clinic/views/Treatments.tsx",
  );
  const content = fs.readFileSync(treatmentsPath, "utf8");

  assert.match(
    content,
    /<MobileFloatingActionMenu[\s\S]*?className="md:hidden"/,
    "Treatments.tsx debe incluir MobileFloatingActionMenu con md:hidden",
  );
  assert.match(
    content,
    /label:\s*"Nuevo Servicio"[\s\S]*?onClick:\s*handleOpenCreate/,
    "Treatments.tsx debe incluir acción 'Nuevo Servicio' que abre ServiceFormModal",
  );
  assert.match(
    content,
    /hidden md:inline-flex[\s\S]*?Nuevo servicio/,
    "Treatments.tsx debe preservar el botón de cabecera tradicional en desktop (hidden md:inline-flex)",
  );
});
