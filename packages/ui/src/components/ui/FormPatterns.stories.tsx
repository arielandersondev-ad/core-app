import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Input } from "./Input";
import { Combobox } from "./Combobox";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { Button } from "./Button";
import { Icons } from "./Icons";
import { formatCurrency } from "../../utils/formatters";

const meta: Meta = {
  title: "Patterns/FormulariosEstándar",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Guía y estándar de diseño para formularios en Core y Dentistry. Establece la altura uniforme (size='sm' / 36px), bordes redondeados consistentes (`rounded-lg`), selectores compactos con búsqueda (`Combobox`), selectores híbridos de fecha y hora (`DatePicker` y `TimePicker` con soporte para escritura directa o popover visual), y diferenciación estricta de datos de solo lectura.",
      },
    },
  },
};

export default meta;

export const FormularioClinicoEstandar: StoryObj = {
  render: () => {
    const [bookingType, setBookingType] = useState<"patient" | "person">(
      "patient",
    );
    const [patient, setPatient] = useState("0194d3f0-1000-7000-8000-000000000100");
    const [personName, setPersonName] = useState("");
    const [personPhone, setPersonPhone] = useState("");
    const [doctor, setDoctor] = useState("");
    const [date, setDate] = useState("2026-10-28");
    const [startTime, setStartTime] = useState("09:00");
    const [treatment, setTreatment] = useState("0194d3f0-0001-7000-8000-000000000001");

    return (
      <div className="w-full max-w-xl mx-auto p-5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-xl space-y-4">
        {/* Header del formulario */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)] font-semibold">
              Estándar de Formulario
            </span>
            <h3 className="font-display font-bold text-base text-[var(--foreground)]">
              Agendar Cita en Consultorio
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)]">
            size=&quot;sm&quot; (36px)
          </span>
        </div>

        {/* Sección 1: Destinatario de la Cita */}
        <div className="bg-[var(--surface-subtle)] border-2 border-[var(--border)] rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/70 pb-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-5.5 h-5.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs mt-0.5">
                1
              </span>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] leading-tight">
                  Destinatario de la Cita
                </h4>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                  Selecciona a quién se le asignará la atención odontológica
                </p>
              </div>
            </div>
          </div>

          {/* Selector de 2 Cards interactivas prominentes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setBookingType("patient")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                bookingType === "patient"
                  ? "bg-[var(--surface-elevated)] border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-xs"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--muted)]/40 hover:bg-[var(--surface-elevated)] opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    bookingType === "patient"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                  }`}
                >
                  {Icons.user}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate leading-tight">
                    Paciente Registrado
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block truncate">
                    Con historia clínica
                  </span>
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                  bookingType === "patient"
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                {bookingType === "patient" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setBookingType("person")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                bookingType === "person"
                  ? "bg-[var(--surface-elevated)] border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-xs"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--muted)]/40 hover:bg-[var(--surface-elevated)] opacity-75 hover:opacity-100"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    bookingType === "person"
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "bg-[var(--surface-subtle)] text-[var(--muted)]"
                  }`}
                >
                  {Icons.user}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block truncate leading-tight">
                    Persona (Sin Expediente)
                  </span>
                  <span className="text-[10px] text-[var(--muted)] block truncate">
                    Atención rápida / primer contacto
                  </span>
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                  bookingType === "person"
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)]"
                }`}
              >
                {bookingType === "person" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
            </button>
          </div>

          {/* Contenido del destinatario según selección */}
          {bookingType === "patient" ? (
            <Combobox
              label="Paciente Seleccionado *"
              selectSize="sm"
              value={patient}
              onChange={setPatient}
              placeholder="Buscar paciente..."
              searchPlaceholder="Nombre o teléfono..."
              options={[
                {
                  value: "p-1",
                  label: "Ana Sofía Martínez",
                  description: "412 901-2233",
                  icon: Icons.user,
                },
                {
                  value: "p-2",
                  label: "Carlos Mendoza",
                  description: "414 332-1144",
                  icon: Icons.user,
                },
                {
                  value: "p-3",
                  label: "María Gabriela Rivas",
                  description: "424 551-8899",
                  icon: Icons.user,
                },
              ]}
              clearable
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <Input
                label="Nombre Completo *"
                inputSize="sm"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Ej. Juan Pérez"
              />
              <Input
                label="Celular / WhatsApp (Opcional)"
                inputSize="sm"
                value={personPhone}
                onChange={(e) => setPersonPhone(e.target.value)}
                placeholder="Ej. 412 1234567"
              />
            </div>
          )}
        </div>

        {/* Sección 2: Atención Odontológica y Horario */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/70 pb-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-5.5 h-5.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs mt-0.5">
                2
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] leading-tight">
                    Atención Odontológica y Horario
                  </h4>
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded leading-none bg-[var(--primary)]/15 text-[var(--primary)] font-semibold">
                    Requerido
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                  Asigna el odontólogo tratante y define la fecha con horario de inicio
                </p>
              </div>
            </div>
          </div>

          <Combobox
            label="Odontólogo Tratante (Opcional)"
            selectSize="sm"
            value={doctor}
            onChange={setDoctor}
            placeholder="Por asignar / Seleccionar..."
            searchPlaceholder="Buscar por nombre..."
            options={[
              {
                value: "doc-1",
                label: "Dra. Valeria Silva",
                icon: Icons.tooth,
              },
              {
                value: "doc-2",
                label: "Dr. Roberto Alarcón",
                icon: Icons.tooth,
              },
            ]}
            clearable
          />

          {/* Horarios con DatePicker y TimePicker híbridos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DatePicker
              label="Fecha *"
              pickerSize="sm"
              value={date}
              onChange={setDate}
              hint="Escribe o abre calendario"
            />

            <TimePicker
              label="Hora de Inicio *"
              pickerSize="sm"
              value={startTime}
              onChange={setStartTime}
              hint="Escribe o abre reloj"
            />

            {/* Dato de solo lectura: NUNCA se muestra como un <input disabled> */}
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-[var(--foreground)]">Fin Estimado</label>
              <div className="h-9 w-full rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between gap-2 px-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                  <span className="shrink-0 text-[var(--muted)] opacity-85">{Icons.clock}</span>
                  <span className="truncate font-medium">09:30</span>
                </div>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                  Auto
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">Estimado 30 min consulta</p>
            </div>
          </div>
        </div>

        {/* Sección 3: Procedimientos (Opcional, por defecto Consulta Simple) */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/70 pb-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-5.5 h-5.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs mt-0.5">
                3
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] leading-tight">
                    Procedimientos
                  </h4>
                  <span className="text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded leading-none bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)] font-medium">
                    Opcional
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                  Tratamientos previstos para la consulta (consulta simple por defecto)
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-[var(--primary)] font-semibold shrink-0">
              30 min · $35.00 USD
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Combobox
              label="Procedimiento (Opcional)"
              selectSize="sm"
              value={treatment}
              onChange={setTreatment}
              placeholder="Por defecto: Consulta simple..."
              searchPlaceholder="Filtrar tratamiento..."
              options={[
                {
                  value: "0194d3f0-0001-7000-8000-000000000001",
                  label: "Consulta Simple y Diagnóstico",
                  description: "30 min",
                  badge: "Base",
                  icon: Icons.treatments,
                },
                {
                  value: "0194d3f0-0002-7000-8000-000000000002",
                  label: "Limpieza Profiláctica",
                  description: "45 min",
                  badge: formatCurrency(35, { currency: "USD" }),
                  icon: Icons.treatments,
                },
                {
                  value: "0194d3f0-0003-7000-8000-000000000003",
                  label: "Restauración Resina",
                  description: "40 min",
                  badge: formatCurrency(45, { currency: "USD" }),
                  icon: Icons.treatments,
                },
              ]}
              clearable
            />

            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-[var(--foreground)]">Total Presupuestado</label>
              <div className="h-9 w-full rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between gap-2 px-3 text-xs">
                <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                  <span className="shrink-0 text-[var(--muted)] opacity-85">{Icons.dollarSign}</span>
                  <span className="truncate font-medium">{formatCurrency(35, { currency: "USD" })}</span>
                </div>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                  Tarifa base
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">Sujeto a confirmación en consulta</p>
            </div>
          </div>
        </div>

        {/* Botonera estandarizada con esquinas uniformes */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
          <Button variant="outline" size="sm">
            Cancelar
          </Button>
          <Button variant="primary" size="sm" leftIcon={Icons.calendar}>
            Confirmar Cita
          </Button>
        </div>
      </div>
    );
  },
};

export const ComparativaEditableVsSoloLectura: StoryObj = {
  render: () => {
    return (
      <div className="w-full max-w-lg mx-auto p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl space-y-3">
        <h4 className="text-xs font-semibold text-[var(--foreground)]">
          Diferenciación entre campo editable y dato solo lectura:
        </h4>

        <div>
          <span className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
            1. Campo Editable (Input estándar)
          </span>
          <Input
            inputSize="sm"
            placeholder="El usuario puede hacer foco y escribir..."
          />
        </div>

        <div>
          <span className="text-[10px] font-mono text-[var(--muted)] uppercase block mb-1">
            2. Dato de Solo Lectura
          </span>
          <div className="h-9 w-full rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between gap-2 px-3 text-xs">
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="shrink-0 text-[var(--muted)] opacity-85">{Icons.shield}</span>
              <span className="truncate font-medium">HIST-2026-88102</span>
            </div>
            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
              No modificable
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-1">
            Se muestra con fondo sutil y badge distintivo; no parece un input roto.
          </p>
        </div>
      </div>
    );
  },
};

export const ModoMobileSinWrap: StoryObj = {
  render: () => {
    const [bookingType, setBookingType] = useState<"patient" | "person">(
      "patient",
    );
    const [patient, setPatient] = useState("p-1");
    const [service, setService] = useState("0194d3f0-0002-7000-8000-000000000002");

    return (
      <div className="w-full max-w-[360px] mx-auto p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl shadow-xl space-y-3.5">
        <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--primary)] font-semibold block truncate">
              Mobile Viewport (360px)
            </span>
            <h4 className="font-display font-bold text-sm text-[var(--foreground)] truncate">
              Agendar Cita Rápida
            </h4>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)] shrink-0">
            Mobile Safe
          </span>
        </div>

        {/* Tabs de alternancia responsivos: sin saltos de línea feos */}
        <div className="grid grid-cols-2 p-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setBookingType("patient")}
            className={`py-1 px-1.5 rounded-md transition-all truncate whitespace-nowrap text-center ${
              bookingType === "patient"
                ? "bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold"
                : "text-[var(--muted)]"
            }`}
          >
            👤 Paciente
          </button>
          <button
            type="button"
            onClick={() => setBookingType("person")}
            className={`py-1 px-1.5 rounded-md transition-all truncate whitespace-nowrap text-center ${
              bookingType === "person"
                ? "bg-[var(--surface)] text-[var(--primary)] shadow-xs font-bold"
                : "text-[var(--muted)]"
            }`}
          >
            📋 Persona
          </button>
        </div>

        {/* Combobox con truncado seguro */}
        <Combobox
          label="Paciente *"
          selectSize="sm"
          value={patient}
          onChange={setPatient}
          placeholder="Buscar paciente..."
          searchPlaceholder="Nombre o teléfono..."
          options={[
            {
              value: "p-1",
              label: "Ana Sofía Martínez Fernández",
              description: "412 901-2233",
              icon: Icons.user,
            },
            {
              value: "p-2",
              label: "Carlos Mendoza Rodríguez",
              description: "414 332-1144",
              icon: Icons.user,
            },
          ]}
        />

        {/* Grid de 2 columnas compacto para Horario con TimePicker */}
        <div className="grid grid-cols-2 gap-2.5">
          <TimePicker label="Hora Inicio *" pickerSize="sm" value="09:00" />
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-[var(--foreground)]">Fin Estimado</label>
            <div className="h-9 w-full rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between gap-1.5 px-2.5 text-xs">
              <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                <span className="shrink-0 text-[var(--muted)] opacity-85">{Icons.clock}</span>
                <span className="truncate font-medium">09:30</span>
              </div>
              <span className="shrink-0 px-1 py-0.5 rounded text-[9px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                Auto
              </span>
            </div>
            <p className="text-[10px] text-[var(--muted)]">30 min</p>
          </div>
        </div>

        {/* Combobox de tratamiento */}
        <Combobox
          label="Tratamiento *"
          selectSize="sm"
          value={service}
          onChange={setService}
          options={[
            {
              value: "0194d3f0-0002-7000-8000-000000000002",
              label: "Limpieza Profiláctica Completa",
              description: "45m",
              badge: formatCurrency(35, { currency: "USD" }),
              icon: Icons.treatments,
            },
          ]}
        />

        {/* Footer responsivo: Total visible + botones táctiles con ancho completo */}
        <div className="pt-3 border-t border-[var(--border)] flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">Total previsto:</span>
            <strong className="font-mono text-sm text-[var(--primary)] font-bold">
              $35.00 USD
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 justify-center rounded-lg"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="flex-1 justify-center rounded-lg shadow-2xs font-semibold"
            >
              Agendar Cita
            </Button>
          </div>
        </div>
      </div>
    );
  },
};

export const RegistroPersonaSimplificado: StoryObj = {
  render: () => {
    const [fullName, setFullName] = useState("Camila Morales");
    const [phone, setPhone] = useState("");

    return (
      <div className="w-full max-w-md mx-auto p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl shadow-md space-y-3.5">
        <div className="border-b border-[var(--border)] pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--primary)] font-semibold">
            Modo Persona (Sin Expediente)
          </span>
          <h4 className="font-display font-bold text-sm text-[var(--foreground)]">
            Registro Rápido de Contacto
          </h4>
        </div>

        <div className="space-y-3">
          <Input
            label="Nombre Completo *"
            inputSize="sm"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Juan Pérez o María Gómez"
          />

          <Input
            label="Celular / WhatsApp (Opcional)"
            inputSize="sm"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej. 71234567 o 412 1234567"
            hint="Opcional: Si el contacto prefiere no dejar teléfono o es agendación espontánea"
          />
        </div>

        <div className="pt-2 border-t border-[var(--border)] flex justify-end gap-2">
          <Button variant="primary" size="sm">
            Guardar y Continuar
          </Button>
        </div>
      </div>
    );
  },
};
