import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Combobox } from "./Combobox";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Icons } from "./Icons";

const meta: Meta<typeof Combobox> = {
  title: "UI/Combobox",
  component: Combobox,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Componente selector con barra de búsqueda integrada (`Combobox / SearchableSelect`). Permite filtrar colecciones extensas (pacientes, profesionales, tratamientos) en tiempo real, soporte de teclado, descripciones, insignias y limpieza rápida.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {
  args: {
    label: "Seleccionar Especialidad",
    placeholder: "Busca una especialidad médica u odontológica...",
    searchPlaceholder: "Escribe para filtrar...",
    options: [
      { value: "general", label: "Odontología General" },
      { value: "ortho", label: "Ortodoncia y Ortopedia Dentofacial" },
      { value: "endo", label: "Endodoncia y Microcirugía Apical" },
      { value: "perio", label: "Periodoncia e Implantología" },
      { value: "pediatric", label: "Odontopediatría" },
      { value: "surgery", label: "Cirugía Oral y Maxilofacial" },
      { value: "prostho", label: "Rehabilitación Oral y Prótesis" },
    ],
  },
};

export const PacientesConBusqueda: Story = {
  render: () => {
    const [selected, setSelected] = useState("p-1");

    const patientOptions = [
      {
        value: "p-1",
        label: "Ana Sofía Martínez",
        description: "+58 412 901-2233",
        badge: "Activo",
        icon: Icons.user,
      },
      {
        value: "p-2",
        label: "Carlos Eduardo Mendoza",
        description: "+58 414 332-1144",
        badge: "En tratamiento",
        icon: Icons.user,
      },
      {
        value: "p-3",
        label: "María Gabriela Rivas",
        description: "+58 424 551-8899",
        badge: "Control",
        icon: Icons.user,
      },
      {
        value: "p-4",
        label: "Juan Diego Castillo",
        description: "+58 416 774-0012",
        badge: "Ortodoncia",
        icon: Icons.user,
      },
      {
        value: "p-5",
        label: "Lucía Valentina Gómez",
        description: "+58 412 660-4433",
        badge: "Consulta",
        icon: Icons.user,
      },
    ];

    return (
      <div className="w-80 space-y-3">
        <Combobox
          label="Paciente *"
          placeholder="Buscar paciente por nombre, teléfono o cédula..."
          searchPlaceholder="Escribe nombre o teléfono..."
          value={selected}
          onChange={setSelected}
          options={patientOptions}
          clearable
        />
        <p className="text-xs text-[var(--muted)]">
          Valor seleccionado: <span className="font-mono font-bold text-[var(--foreground)]">{selected || "(ninguno)"}</span>
        </p>
      </div>
    );
  },
};

export const OdontologosTratantes: Story = {
  render: () => {
    const [selected, setSelected] = useState("");

    const professionalOptions = [
      {
        value: "doc-1",
        label: "Dra. Valeria Silva",
        description: "Ortodoncia Invisible y Brackets",
        badge: "Box 1",
        icon: Icons.tooth,
      },
      {
        value: "doc-2",
        label: "Dr. Roberto Alarcón",
        description: "Rehabilitación Oral e Implantes",
        badge: "Box 2",
        icon: Icons.tooth,
      },
      {
        value: "doc-3",
        label: "Dra. Carolina Méndez",
        description: "Endodoncia Microscópica",
        badge: "Box 3",
        icon: Icons.tooth,
      },
      {
        value: "doc-4",
        label: "Dr. Fernando Morales",
        description: "Cirugía Maxilofacial y Cordales",
        badge: "Quirófano A",
        icon: Icons.tooth,
      },
    ];

    return (
      <div className="w-80 space-y-3">
        <Combobox
          label="Odontólogo Asignado *"
          placeholder="Seleccionar doctor o especialista..."
          searchPlaceholder="Filtrar por especialista o consultorio..."
          value={selected}
          onChange={setSelected}
          options={professionalOptions}
          helperText="El profesional asignado recibirá la notificación de la cita."
          clearable
        />
      </div>
    );
  },
};

export const TratamientosConPrecios: Story = {
  render: () => {
    const [selected, setSelected] = useState("");

    const treatmentOptions = [
      {
        value: "svc-1",
        label: "Limpieza Dental Profiláctica Profunda",
        description: "Duración estimada: 45 min",
        badge: "$35.00",
      },
      {
        value: "svc-2",
        label: "Restauración Resina Fotocurada",
        description: "Duración estimada: 40 min",
        badge: "$45.00",
      },
      {
        value: "svc-3",
        label: "Tratamiento de Conducto (Endodoncia)",
        description: "Duración estimada: 90 min",
        badge: "$150.00",
      },
      {
        value: "svc-4",
        label: "Extracción Simple de Pieza Dental",
        description: "Duración estimada: 30 min",
        badge: "$40.00",
      },
      {
        value: "svc-5",
        label: "Exodoncia de Tercer Molar (Cordal)",
        description: "Duración estimada: 60 min",
        badge: "$90.00",
      },
      {
        value: "svc-6",
        label: "Blanqueamiento Dental LED",
        description: "Duración estimada: 60 min",
        badge: "$120.00",
      },
    ];

    return (
      <div className="w-96 space-y-3">
        <Combobox
          label="Tratamiento / Servicio"
          placeholder="+ Añadir tratamiento a la cita..."
          searchPlaceholder="Buscar por nombre de procedimiento..."
          value={selected}
          onChange={setSelected}
          options={treatmentOptions}
          clearable
        />
      </div>
    );
  },
};

export const ConErrorValidacion: Story = {
  args: {
    label: "Sucursal Obligatoria",
    error: "Debes seleccionar una clínica o sucursal válida",
    placeholder: "Selecciona una sede...",
    options: [
      { value: "sede-1", label: "Sede Centro Clínico Norte" },
      { value: "sede-2", label: "Sede Las Mercedes" },
    ],
  },
};

export const CompactoSmall: Story = {
  args: {
    label: "Filtro rápido",
    selectSize: "sm",
    placeholder: "Filtrar por estado...",
    options: [
      { value: "all", label: "Todos los estados" },
      { value: "confirmed", label: "Confirmadas" },
      { value: "pending", label: "Pendientes" },
      { value: "completed", label: "Atendidas" },
      { value: "cancelled", label: "Canceladas" },
    ],
  },
};

export const IntegradoEnModal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [patient, setPatient] = useState("");
    const [doctor, setDoctor] = useState("");

    return (
      <div className="flex flex-col items-center gap-4">
        <Button onClick={() => setOpen(true)} leftIcon={Icons.calendar}>
          Abrir Modal con Selectores Buscables
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Agendar Cita en Consultorio"
          subtitle="Verificación de centrado en pantalla y selección con búsqueda"
          icon={Icons.calendar}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <Combobox
              label="Paciente *"
              placeholder="Escribe el nombre o teléfono del paciente..."
              searchPlaceholder="Buscar paciente..."
              value={patient}
              onChange={setPatient}
              options={[
                {
                  value: "1",
                  label: "Ana Sofía Martínez",
                  description: "+58 412 901-2233",
                  icon: Icons.user,
                },
                {
                  value: "2",
                  label: "Carlos Mendoza",
                  description: "+58 414 332-1144",
                  icon: Icons.user,
                },
                {
                  value: "3",
                  label: "María Gabriela Rivas",
                  description: "+58 424 551-8899",
                  icon: Icons.user,
                },
              ]}
              clearable
            />

            <Combobox
              label="Odontólogo Tratante"
              selectSize="sm"
              placeholder="Por asignar / Seleccionar doctor..."
              searchPlaceholder="Buscar por nombre..."
              value={doctor}
              onChange={setDoctor}
              options={[
                {
                  value: "d-1",
                  label: "Dra. Valeria Silva",
                  badge: "Box 1",
                },
                {
                  value: "d-2",
                  label: "Dr. Roberto Alarcón",
                  badge: "Box 2",
                },
              ]}
              clearable
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => setOpen(false)}
                disabled={!patient || !doctor}
              >
                Confirmar Cita
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};
