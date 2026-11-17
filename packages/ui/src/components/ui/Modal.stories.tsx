import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { Combobox } from "./Combobox";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { Badge } from "./Badge";
import { Icons } from "./Icons";
import { formatCurrency } from "../../utils/formatters";

const meta: Meta<typeof Modal> = {
  title: "UI/Modal",
  component: Modal,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modal dialog centrado para escritorio y flujos estructurados de la plataforma. Sincronizado exactamente con las vistas activas de la web (Dentistry y Core): soporta encabezados con icono y eyebrow, campos estandarizados con border-radius md (rounded-md), pie fijo sticky bottom mediante ModalFooter y múltiples anchos (max-w-md a max-w-3xl).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

/**
 * 1. Formulario Completo de Citas (Sincronizado 1:1 con CreateAppointmentModal de Dentistry)
 * Demuestra:
 * - Indicadores numéricos de paso (1, 2, 3) en círculos con background primary
 * - Selector segmentado Paciente vs Registro Rápido (Persona) con border-radius md
 * - Selectores DatePicker y TimePicker de @app/ui interactivos
 * - Combobox asíncrono para tratamientos (solo Nombre y Precio)
 * - Botones de acción anclados en sticky bottom sin scroll
 */
export const AppointmentFormModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [bookingType, setBookingType] = useState<"patient" | "person">("person");
    const [fullName, setFullName] = useState("Carlos Mendoza");
    const [phone, setPhone] = useState("76543210");
    const [date, setDate] = useState("2026-11-04");
    const [startTime, setStartTime] = useState("09:00");
    const [selectedServices, setSelectedServices] = useState([
      { id: "0194d3f0-0001-7000-8000-000000000001", name: "Evaluación y Diagnóstico Inicial", duration: 30, price: 150 },
      { id: "0194d3f0-0002-7000-8000-000000000002", name: "Limpieza y Profilaxis Dental", duration: 30, price: 200 },
    ]);
    const [serviceToAdd, setServiceToAdd] = useState("");

    const serviceCatalog = [
      { value: "0194d3f0-0003-7000-8000-000000000003", label: "Endodoncia Molar", description: formatCurrency(850) },
      { value: "0194d3f0-0004-7000-8000-000000000004", label: "Restauración con Resina Estética", description: formatCurrency(250) },
      { value: "0194d3f0-0005-7000-8000-000000000005", label: "Blanqueamiento Dental LED", description: formatCurrency(600) },
    ];

    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
    const totalMinutes = selectedServices.reduce((acc, s) => acc + s.duration, 0);

    const handleAddService = (val: string) => {
      const found = serviceCatalog.find((s) => s.value === val);
      if (found && !selectedServices.some((s) => s.id === found.value)) {
        setSelectedServices((prev) => [
          ...prev,
          { id: found.value, name: found.label, duration: 45, price: 250 },
        ]);
      }
      setServiceToAdd("");
    };

    const handleRemoveService = (id: string) => {
      setSelectedServices((prev) => prev.filter((s) => s.id !== id));
    };

    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-center max-w-md">
          <p className="text-sm text-[var(--muted)] mb-2">
            Modal de citas sincronizado con la web: pasos numerados en círculos primary,
            campos con rounded-md y sticky bottom footer.
          </p>
          <Button onClick={() => setOpen(true)} variant="primary" leftIcon={Icons.plus}>
            Abrir Modal de Citas (Formulario Real)
          </Button>
        </div>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Agendar Nueva Cita"
          subtitle="Programar turno con paciente registrado o registro rápido de persona"
          icon={Icons.calendar}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[var(--muted)] font-mono">
                {selectedServices.length} servicios · {formatCurrency(totalPrice)}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Confirmar y Agendar Cita
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            {/* ── PASO 1: Destinatario ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  1
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                  Destinatario de la Cita
                </h3>
              </div>

              {/* Selector segmentado con rounded-md */}
              <div className="flex items-center gap-2 p-1 bg-[var(--background)] border border-[var(--border)] rounded-md mb-3">
                <button
                  type="button"
                  onClick={() => setBookingType("patient")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                    bookingType === "patient"
                      ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  👤 Paciente
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType("person")}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all ${
                    bookingType === "person"
                      ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  👤 Registro Rápido
                </button>
              </div>

              {bookingType === "person" ? (
                <div className="space-y-3 p-3.5 rounded-md border border-[var(--primary)]/20 bg-[var(--primary)]/5">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                      Nombre Completo *
                    </label>
                    <Input
                      placeholder="Ej. Carlos Mendoza"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Teléfono Celular (Opcional)
                      </label>
                      <Input
                        type="tel"
                        placeholder="Ej. 76543210"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                        Correo Electrónico (Opcional)
                      </label>
                      <Input
                        type="email"
                        placeholder="carlos@example.com"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <Combobox
                  label="Buscar Paciente Registrado"
                  placeholder="Escribe el nombre o teléfono del paciente..."
                  options={[
                    { value: "p1", label: "María Elena González", description: "71234567" },
                    { value: "p2", label: "Rodrigo Fernández", description: "78901234" },
                    { value: "p3", label: "Camila Silva", description: "72345678" },
                  ]}
                  value="p1"
                  onChange={() => {}}
                />
              )}
            </div>

            {/* ── PASO 2: Horario ── */}
            <div className="pt-2 border-t border-[var(--border)]/60">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                  2
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                  Programación de Horario
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DatePicker
                  label="Fecha *"
                  value={date}
                  onChange={(d) => setDate(d)}
                />
                <TimePicker
                  label="Hora de Inicio *"
                  value={startTime}
                  onChange={(t) => setStartTime(t)}
                />
                <div>
                  <label className="block text-xs font-semibold text-[var(--muted)] mb-1">
                    Fin Estimado
                  </label>
                  <div className="h-10 px-3.5 rounded-md bg-[var(--surface)] border border-[var(--border)] flex items-center font-mono text-sm text-[var(--foreground)]">
                    10:00 (+{totalMinutes} min)
                  </div>
                </div>
              </div>
            </div>

            {/* ── PASO 3: Procedimientos ── */}
            <div className="pt-2 border-t border-[var(--border)]/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                    3
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] font-mono">
                    Procedimientos Odontológicos
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-[var(--primary)] font-semibold">
                  {totalMinutes} min · {formatCurrency(totalPrice)}
                </span>
              </div>

              {/* Chips con rounded-md */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--foreground)] shadow-2xs"
                  >
                    <span className="font-medium">{svc.name}</span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {svc.duration}m · {formatCurrency(svc.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveService(svc.id)}
                      className="text-[var(--muted)] hover:text-red-500 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <Combobox
                label="Añadir Procedimiento / Tratamiento Odontológico"
                options={serviceCatalog}
                value={serviceToAdd}
                onChange={handleAddService}
                placeholder="+ Buscar y añadir tratamiento..."
              />
            </div>

            {/* Notas opcionales */}
            <div className="pt-2 border-t border-[var(--border)]/60">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Motivo o Notas de la Consulta (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Indicaciones previas, requerimiento de instrumental o urgencia..."
                className="w-full px-3.5 py-2.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary)] text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none"
              />
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * 2. Formulario Wizard de Organización (Sincronizado con CreateOrganizationDialog de Core)
 */
export const OrganizationWizardModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [currency, setCurrency] = useState("CLP");

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="outline" leftIcon={Icons.settings}>
          Abrir Wizard de Organización (Core Web)
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Crear organización"
          description="Configura la organización, sus roles y sucursales iniciales."
          eyebrow="Configuración"
          icon={Icons.settings}
          headerAction={
            <Badge variant="primary" size="sm">
              Paso 1 de 3
            </Badge>
          }
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Descartar
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Atrás
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Continuar a Roles
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4 py-1">
            <Input
              label="Nombre de la empresa / clínica"
              placeholder="Clínica Dental San Juan"
              defaultValue="Clínica Odontológica Central"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Identificador Fiscal / RUT"
                placeholder="76.123.456-7"
                defaultValue="76.999.888-0"
              />
              <Select
                label="Moneda Principal"
                options={[
                  { value: "CLP", label: "Peso Chileno (CLP)" },
                  { value: "BOB", label: "Boliviano (BOB)" },
                  { value: "USD", label: "Dólar Estadounidense (USD)" },
                ]}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <Input
              label="Email de Contacto Administrativo"
              type="email"
              placeholder="contacto@organizacion.com"
              defaultValue="admin@odontocentral.com"
            />
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * 3. Detalle de Cita en Modo Solo Lectura con Menú Vertical (⋮)
 */
export const ReadOnlyAppointmentDetailModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="secondary" leftIcon={Icons.calendar}>
          Ver Detalle de Cita (Solo Lectura + Menú ⋮)
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Valentina Morales"
          subtitle="Miércoles 4 de Noviembre · 09:00 - 09:45 (45 min)"
          icon={Icons.calendar}
          eyebrow="Cita Odontológica"
          headerAction={
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm" dot>
                En Espera
              </Badge>
              <button
                type="button"
                className="w-8 h-8 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-subtle)] border border-[var(--border)] transition-colors cursor-pointer"
                title="Opciones de estado"
                aria-label="Opciones"
              >
                ⋮
              </button>
            </div>
          }
          maxWidth="max-w-xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[var(--muted)]">Atención asignada a Box 2</span>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cerrar Detalle
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-[var(--foreground)]">Profesional Asignado</label>
              <div className="h-9 px-3 rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center gap-2 text-xs">
                <span className="shrink-0 text-[var(--muted)] opacity-85">{Icons.user}</span>
                <span className="font-medium truncate">Dra. Paulina Vega (Endodoncia)</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="text-xs font-semibold text-[var(--foreground)]">Teléfono de Contacto</label>
              <div className="h-9 px-3 rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between text-xs">
                <span className="font-medium truncate">+56 9 1234 5678</span>
                <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                  WhatsApp activo
                </span>
              </div>
            </div>
            <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2">
              <span className="text-xs font-semibold text-[var(--foreground)]">
                Tratamientos Planificados
              </span>
              <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]/50">
                <span>Evaluación Clínica Inicial</span>
                <span className="font-mono text-[var(--muted)]">{formatCurrency(150)}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-1 border-b border-[var(--border)]/50">
                <span>Profilaxis y Limpieza Ultrasonido</span>
                <span className="font-mono text-[var(--muted)]">{formatCurrency(200)}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <span>Total Estimado</span>
                <span className="font-mono text-[var(--primary)] text-sm">{formatCurrency(350)}</span>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * 4. Modal de Confirmación Crítica / Destructiva (Cancelar Cita)
 */
export const DestructiveConfirmationModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="danger" leftIcon={Icons.alert}>
          Abrir Diálogo de Cancelación
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Cancelar Cita Odontológica"
          subtitle="Esta acción liberará el espacio en la agenda de la clínica."
          icon={Icons.alert}
          eyebrow="Acción Reversible"
          maxWidth="max-w-md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Volver
              </Button>
              <Button variant="danger" onClick={() => setOpen(false)}>
                Confirmar Cancelación
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-2">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Por favor indica el motivo de la cancelación para registrarlo en el historial
              clínico del paciente:
            </p>
            <Input
              placeholder="Ej. Paciente solicita reagendar por motivos laborales"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </Modal>
      </div>
    );
  },
};

/**
 * 5. Variantes de Ancho (max-w-md a max-w-3xl)
 */
export const SizeVariantsModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [size, setSize] = useState<"max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl">("max-w-xl");

    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="flex items-center gap-2">
          {(["max-w-md", "max-w-lg", "max-w-xl", "max-w-2xl", "max-w-3xl"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                size === s
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs"
                  : "bg-[var(--surface-subtle)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Button onClick={() => setOpen(true)} variant="primary">
          Abrir Modal ({size})
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title={`Modal Tamaño ${size}`}
          subtitle="Previsualización de proporción y ancho máximo para distintos tipos de formularios."
          maxWidth={size}
          footer={
            <Button variant="primary" onClick={() => setOpen(false)}>
              Cerrar
            </Button>
          }
        >
          <div className="p-4 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)] text-center text-xs text-[var(--muted)] font-mono">
            Contenido adaptado dinámicamente a la clase: <strong>{size}</strong>
          </div>
        </Modal>
      </div>
    );
  },
};
