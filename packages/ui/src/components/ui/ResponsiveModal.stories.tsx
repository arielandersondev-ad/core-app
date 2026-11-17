import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ResponsiveModal } from "./ResponsiveModal";
import { Button } from "./Button";
import { Input } from "./Input";
import { Select } from "./Select";
import { DatePicker } from "./DatePicker";
import { TimePicker } from "./TimePicker";
import { Badge } from "./Badge";
import { Icons } from "./Icons";

const meta: Meta<typeof ResponsiveModal> = {
  title: "UI/ResponsiveModal",
  component: ResponsiveModal,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Modal adaptable y responsivo transversal. En pantallas de escritorio (>= 768px) renderiza un Modal centrado con fondo desenfocado; en pantallas móviles (< 768px) se transforma automáticamente en un BottomSheet con soporte de arrastre/swipe hacia abajo y snap points.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResponsiveModal>;

/**
 * 1. Story Interactiva Adaptable:
 * Ajusta el ancho de tu navegador o activa la vista 'Mobile' en la barra superior de Storybook
 * para observar la transición fluida entre Modal centrado y BottomSheet deslizable.
 */
export const AdaptiveInteractive: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-center max-w-md mb-2">
          <p className="text-sm text-[var(--muted)]">
            Abre el modal y redimensiona la ventana (o cambia a vista móvil &lt; 768px)
            para ver cómo cambia automáticamente entre Modal y BottomSheet.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} leftIcon={Icons.plus} variant="primary">
          Abrir Modal Responsivo
        </Button>

        <ResponsiveModal
          open={open}
          onClose={() => setOpen(false)}
          title="Crear Nueva Cita Odontológica"
          subtitle="Completa la información clínica inicial del paciente."
          eyebrow="Atención Clínica"
          icon={Icons.calendar}
          footer={
            <div className="flex items-center justify-end gap-3 w-full">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                Confirmar y Agendar
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            <Input label="Nombre del paciente" placeholder="Ej. Camila Silva" />
            <Input label="Teléfono de contacto" placeholder="+56 9 1234 5678" />
            <Select
              label="Especialidad / Tratamiento"
              options={[
                { value: "eval", label: "Evaluación y Diagnóstico Inicial" },
                { value: "clean", label: "Limpieza y Profilaxis Dental" },
                { value: "endo", label: "Endodoncia / Tratamiento de Conducto" },
                { value: "orto", label: "Ortodoncia y Brackets" },
              ]}
              value="eval"
              onChange={() => {}}
            />
            <Input
              label="Observaciones o motivo de consulta"
              placeholder="Ej. Dolor leve en molar superior izquierdo"
            />
          </div>
        </ResponsiveModal>
      </div>
    );
  },
};

/**
 * 2. Formulario Completo de Organización (Track A - HAG-2 Pattern)
 */
export const OrganizationFormModal: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="outline">
          Crear Organización (Simulación Formulario)
        </Button>

        <ResponsiveModal
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
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Descartar
              </Button>
              <div className="flex gap-2">
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
          <div className="flex flex-col gap-4 py-2">
            <Input label="Nombre de la empresa / clínica" placeholder="Clínica Dental San Juan" />
            <Input label="RUT / Identificador fiscal" placeholder="76.123.456-7" />
            <Input label="Email de contacto administrativo" placeholder="admin@clinicasanjuan.cl" />
            <Select
              label="Moneda principal"
              options={[
                { value: "CLP", label: "Peso Chileno (CLP)" },
                { value: "USD", label: "Dólar Estadounidense (USD)" },
              ]}
              value="CLP"
              onChange={() => {}}
            />
          </div>
        </ResponsiveModal>
      </div>
    );
  },
};

/**
 * 3. Modo Forzado BottomSheet Móvil (para demostración de gestos touch/swipe)
 */
export const ForzedMobileBottomSheet: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="secondary">
          Abrir en Modo BottomSheet Forzado
        </Button>

        <ResponsiveModal
          open={open}
          onClose={() => setOpen(false)}
          forceMode="bottomSheet"
          title="Detalle de Consulta Odontológica"
          subtitle="Paciente en sala de espera"
          eyebrow="Dentistry Vertical"
          icon={Icons.calendar}
          snapPoint="half"
          headerAction={
            <Badge variant="warning" size="sm" dot>
              En Espera
            </Badge>
          }
          footer={
            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Llamar a Box de Atención
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setOpen(false)}
              >
                Reagendar Cita
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="p-3 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">Tratamiento planificado</p>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                Restauración estética con resina (Pieza 2.4)
              </p>
            </div>
            <div className="p-3 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">Profesional asignado</p>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                Dra. Paulina Vega (Endodoncia)
              </p>
            </div>
            <div className="p-3 rounded-md bg-[var(--surface-sunken)] border border-[var(--border)]">
              <p className="text-xs text-[var(--muted)]">Hora agendada</p>
              <p className="text-sm font-semibold text-[var(--foreground)] mt-0.5">
                10:30 hrs - Duración estimada: 45 min
              </p>
            </div>
          </div>
        </ResponsiveModal>
      </div>
    );
  },
};

/**
 * 4. Modo Forzado Modal Desktop
 */
export const ForcedDesktopModal: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="outline">
          Abrir en Modo Modal Forzado
        </Button>

        <ResponsiveModal
          open={open}
          onClose={() => setOpen(false)}
          forceMode="modal"
          title="Vista Previa Modal Escritorio"
          subtitle="Modo fijado en Modal centrado sin importar el tamaño de pantalla."
          icon={Icons.info}
          footer={
            <div className="flex justify-end gap-3 w-full">
              <Button variant="primary" onClick={() => setOpen(false)}>
                Entendido
              </Button>
            </div>
          }
        >
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Este modal utiliza la propiedad <code>forceMode="modal"</code>, ideal para flujos que requieren
            estrictamente el diseño tipo diálogo centrado o diálogos de confirmación crítica en pantallas grandes.
          </p>
        </ResponsiveModal>
      </div>
    );
  },
};

/**
 * 5. Formulario Extenso con Sticky Bottom Footer y Selectores de Fecha/Hora
 */
export const StickyBottomFooterForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState("2026-11-04");
    const [time, setTime] = useState("09:30");

    return (
      <div className="p-8 text-center">
        <Button onClick={() => setOpen(true)} variant="primary" leftIcon={Icons.calendar}>
          Abrir Formulario Extenso con Sticky Footer
        </Button>

        <ResponsiveModal
          open={open}
          onClose={() => setOpen(false)}
          title="Nueva Cita Médica Extensa"
          subtitle="Los botones de Guardar y Cancelar permanecen fijos al fondo sin importar el scroll."
          eyebrow="Agenda Clínica"
          icon={Icons.calendar}
          footerSticky={true}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[var(--muted)]">Campos requeridos completados</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={() => setOpen(false)}>
                  Confirmar y Agendar
                </Button>
              </div>
            </div>
          }
        >
          <div className="flex flex-col gap-4 py-2">
            <Input label="Nombre del paciente" placeholder="Ej. Roberto Morales" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DatePicker label="Fecha de la Cita" value={date} onChange={setDate} />
              <TimePicker label="Hora de Inicio" value={time} onChange={setTime} />
            </div>
            <Input label="Teléfono de contacto" placeholder="+56 9 8765 4321" />
            <Input label="Correo electrónico" placeholder="roberto@example.com" />
            <Input label="Motivo de la consulta" placeholder="Revisión semestral y limpieza" />
            <Input label="Tratamiento previo" placeholder="Extracción dental (2024)" />
            <Input label="Alergias conocidas" placeholder="Ninguna reportada" />
            <Input label="Observaciones clínicas" placeholder="Sensibilidad en premolar" />
            <Input label="Notas adicionales" placeholder="Paciente prefiere turnos por la mañana" />
          </div>
        </ResponsiveModal>
      </div>
    );
  },
};
