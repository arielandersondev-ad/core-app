import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  MobileFloatingActionMenu,
  type MobileFloatingActionItem,
} from "./MobileFloatingActionMenu";
import { Icons } from "./Icons";
import { Badge } from "./Badge";

const meta: Meta<typeof MobileFloatingActionMenu> = {
  title: "UI/MobileFloatingActionMenu",
  component: MobileFloatingActionMenu,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Menú de acción flotante tipo Speed-Dial (FAB) exclusivo para dispositivos móviles (`md:hidden`). Se ubica en `fixed bottom-25 right-4 z-30` para despejar el `BottomNav` móvil. Al abrirse, rota suavemente el icono '+' 45° convirtiéndolo en 'x', muestra un backdrop translúcido (`bg-black/40 backdrop-blur-xs z-20`) y eleva verticalmente las acciones contextuales con etiquetas en píldora.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MobileFloatingActionMenu>;

/**
 * 1. Agenda Clínica (3 Acciones Rápidas: Nueva Cita, Nuevo Paciente, Cobro Rápido)
 */
export const ClinicAgendaSpeedDial: Story = {
  render: () => {
    const [lastAction, setLastAction] = useState<string>("Ninguna aún");

    const actions: MobileFloatingActionItem[] = [
      {
        id: "new-appointment",
        label: "Nueva Cita",
        description: "Agendar turno clínico",
        icon: Icons.calendar,
        variant: "primary",
        onClick: () => setLastAction("Nueva Cita (CreateAppointmentModal)"),
      },
      {
        id: "new-patient",
        label: "Nuevo Paciente",
        description: "Ficha rápida de paciente",
        icon: Icons.user,
        variant: "default",
        onClick: () => setLastAction("Nuevo Paciente (CreatePatientModal)"),
      },
      {
        id: "quick-payment",
        label: "Cobro Rápido",
        description: "Registrar ingreso en caja",
        icon: Icons.dollarSign,
        variant: "default",
        onClick: () => setLastAction("Cobro Rápido (RegisterPaymentModal)"),
      },
    ];

    return (
      <div className="relative mx-auto w-full max-w-[390px] h-[540px] rounded-3xl border-2 border-[var(--border)] bg-[var(--background)] overflow-hidden shadow-xl [transform:translateZ(0)] flex flex-col justify-between">
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-[var(--foreground)]">
              Agenda Clínica (Vista Móvil)
            </h3>
            <Badge variant="primary" size="sm">
              Speed-Dial FAB
            </Badge>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Pulsa el botón circular <strong>+</strong> en la esquina inferior
            derecha (sobre el BottomNav) para desplegar las acciones rápidas.
          </p>
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs">
            <span className="text-[var(--muted)] block mb-1">
              Última acción ejecutada:
            </span>
            <strong className="text-[var(--primary)] font-mono">
              {lastAction}
            </strong>
          </div>
        </div>

        {/* Simulación de BottomNav móvil (h-16) */}
        <div className="h-16 border-t border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-between text-[11px] text-[var(--muted)] z-10">
          <span>Pacientes</span>
          <span className="px-3 py-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold">
            Agenda
          </span>
          <span>Pagos</span>
        </div>

        <MobileFloatingActionMenu
          actions={actions}
          ariaLabel="Acciones rápidas de agenda"
          mobileOnly={false}
        />
      </div>
    );
  },
};

/**
 * 2. Estado Abierto por Defecto (Inspección Visual de Píldoras y Variantes)
 */
export const OpenByDefaultPreview: Story = {
  render: () => {
    const actions: MobileFloatingActionItem[] = [
      {
        id: "new-org",
        label: "Nueva Organización",
        icon: Icons.building,
        variant: "primary",
        onClick: () => {},
      },
      {
        id: "new-branch",
        label: "Nueva Sucursal",
        icon: Icons.branch,
        variant: "default",
        onClick: () => {},
      },
      {
        id: "emergency",
        label: "Alerta Urgente",
        icon: Icons.alertTriangle,
        variant: "danger",
        onClick: () => {},
      },
    ];

    return (
      <div className="relative mx-auto w-full max-w-[390px] h-[500px] rounded-3xl border-2 border-[var(--border)] bg-[var(--background)] overflow-hidden shadow-xl [transform:translateZ(0)] flex flex-col justify-between">
        <div className="p-5">
          <h3 className="font-display font-bold text-base text-[var(--foreground)]">
            Menú Desplegado (Speed-Dial Activo)
          </h3>
          <p className="text-xs text-[var(--muted)] mt-1">
            Muestra la rotación de 45° del botón principal, el backdrop con
            desenfoque y las 3 variantes de acción (`primary`, `default`,
            `danger`).
          </p>
        </div>

        <div className="h-16 border-t border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-around text-[11px] text-[var(--muted)] z-10">
          <span>Usuarios</span>
          <span>Organizaciones</span>
          <span>Roles</span>
        </div>

        <MobileFloatingActionMenu
          actions={actions}
          ariaLabel="Acciones de organización"
          defaultOpen={true}
          mobileOnly={false}
        />
      </div>
    );
  },
};

/**
 * 3. Acción Rápida Individual (Ej. Nuevo Usuario / Nuevo Servicio)
 */
export const SingleActionFab: Story = {
  render: () => {
    const [count, setCount] = useState(0);

    return (
      <div className="relative mx-auto w-full max-w-[390px] h-[420px] rounded-3xl border-2 border-[var(--border)] bg-[var(--background)] overflow-hidden shadow-xl [transform:translateZ(0)] flex flex-col justify-between">
        <div className="p-5 space-y-2">
          <h3 className="font-display font-bold text-base text-[var(--foreground)]">
            Listado de Tratamientos / Usuarios
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Veces accionado: <strong>{count}</strong>
          </p>
        </div>

        <div className="h-16 border-t border-[var(--border)] bg-[var(--surface)] px-6 flex items-center justify-center text-[11px] text-[var(--muted)] z-10">
          Barra de Navegación Inferior (BottomNav)
        </div>

        <MobileFloatingActionMenu
          ariaLabel="Acciones de servicios"
          mobileOnly={false}
          actions={[
            {
              id: "new-service",
              label: "Nuevo Servicio",
              icon: Icons.plus,
              variant: "primary",
              onClick: () => setCount((c) => c + 1),
            },
          ]}
        />
      </div>
    );
  },
};
