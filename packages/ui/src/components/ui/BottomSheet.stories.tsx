import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { BottomSheet, type BottomSheetSnapPoint } from "./BottomSheet";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Icons } from "./Icons";
import { formatCurrency } from "../../utils/formatters";

const meta: Meta<typeof BottomSheet> = {
  title: "Components/BottomSheet",
  component: BottomSheet,
  parameters: {
    layout: "centered",
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof BottomSheet>;

// ── Story 1: Detalle Completo de Cita Odontológica en Mobile ──────────────────
export const AppointmentDetailMobile: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <div className="p-4 text-center">
        <Button onClick={() => setOpen(true)}>
          Ver Detalle de Cita (Mobile Sheet)
        </Button>

        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          eyebrow="Cita Odontológica"
          title="Valentina Morales"
          subtitle="Miércoles 28 Oct · 09:00 - 09:45"
          icon={Icons.calendar}
          snapPoint="auto"
          headerAction={
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm" dot>
                En Sala de Espera
              </Badge>
              <button
                type="button"
                className="w-7 h-7 rounded-md flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] transition-colors cursor-pointer text-xs"
                title="Acciones de estado"
                aria-label="Acciones de estado"
                onClick={() => alert("Menú de 3 puntos: Confirmar, Pasar a Box, Completar, Cancelar Cita")}
              >
                ⋮
              </button>
            </div>
          }
          footer={
            <div className="flex items-center justify-between gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setOpen(false)}
              >
                Cerrar Detalle
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="flex-1 flex items-center justify-center gap-1.5"
                onClick={() =>
                  alert("Navegando al expediente 360° del paciente...")
                }
              >
                <span>Ver Ficha 360°</span>
                <span className="w-3.5 h-3.5">{Icons.chevronRight}</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {/* Tarjeta de Paciente */}
            <div className="p-3.5 rounded-md bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center font-bold text-xs shadow-xs">
                  VM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      Valentina Morales
                    </span>
                    <Badge variant="success" size="sm">
                      Registrada
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    CI: 8392102 · 28 años · +591 76543210
                  </p>
                </div>
              </div>
              <a
                href="https://wa.me/59176543210"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 flex items-center justify-center transition-transform active:scale-95 shrink-0"
                title="Contactar por WhatsApp"
              >
                <span className="w-4 h-4">{Icons.whatsappReal}</span>
              </a>
            </div>

            {/* Resumen de Horario y Box */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">
                  Horario Previsto
                </span>
                <span className="text-sm font-bold text-[var(--foreground)] block mt-0.5">
                  09:00 – 09:45
                </span>
                <span className="text-[11px] text-[var(--primary)] font-medium">
                  45 min de sesión
                </span>
              </div>
              <div className="p-3 rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted)] block">
                  Profesional & Box
                </span>
                <span className="text-sm font-bold text-[var(--foreground)] block mt-0.5 truncate">
                  Dra. Ana Silva
                </span>
                <span className="text-[11px] text-[var(--muted)]">
                  Sillón Dental #2
                </span>
              </div>
            </div>

            {/* Procedimientos y Presupuesto */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--foreground)] block">
                Procedimientos Asignados
              </span>
              <div className="divide-y divide-[var(--border)]/70 rounded-md border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                <div className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[var(--foreground)] block">
                      Profilaxis y Limpieza Profunda
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      30 min · Código SRV-001
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[var(--foreground)]">
                    {formatCurrency(180)}
                  </span>
                </div>
                <div className="p-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[var(--foreground)] block">
                      Aplicación de Flúor Barniz
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      15 min · Código SRV-004
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[var(--foreground)]">
                    {formatCurrency(80)}
                  </span>
                </div>
                <div className="p-3 bg-[var(--surface-subtle)] flex items-center justify-between text-xs font-bold">
                  <span className="text-[var(--foreground)]">
                    Total Estimado
                  </span>
                  <span className="font-mono text-[var(--primary)] text-sm">
                    {formatCurrency(260)}
                  </span>
                </div>
              </div>
            </div>

            {/* Motivo de Consulta / Notas */}
            <div className="p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs space-y-1">
              <span className="font-semibold text-[var(--foreground)] block">
                Motivo / Nota de Agendamiento:
              </span>
              <p className="text-[var(--muted)] leading-relaxed">
                Paciente acude por control semestral y ligera molestia gingival
                en sector anterior. Solicita presupuesto de blanqueamiento.
              </p>
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  },
};

// ── Story 2: Menú de Acciones Rápidas (Action Sheet) ──────────────────────────
export const QuickActionsMenu: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    const actions = [
      {
        icon: Icons.whatsappReal,
        title: "Enviar Confirmación por WhatsApp",
        desc: "Plantilla oficial con fecha, hora y ubicación",
        color: "text-emerald-600 bg-emerald-500/10",
      },
      {
        icon: Icons.check,
        title: "Marcar Paciente en Sala de Espera",
        desc: "Notificar al odontólogo tratante de su llegada",
        color: "text-blue-600 bg-blue-500/10",
      },
      {
        icon: Icons.dollar,
        title: "Registrar Cobro / Anticipo",
        desc: "Generar comprobante o recibo de caja",
        color: "text-amber-600 bg-amber-500/10",
      },
      {
        icon: Icons.calendar,
        title: "Reprogramar Fecha y Hora",
        desc: "Mover a otro horario sin perder historial",
        color: "text-[var(--primary)] bg-[var(--primary-subtle)]",
      },
      {
        icon: Icons.cross,
        title: "Cancelar Cita",
        desc: "Registrar motivo de inasistencia o baja",
        color: "text-red-600 bg-red-500/10",
      },
    ];

    return (
      <div className="p-4 text-center">
        <Button onClick={() => setOpen(true)}>Abrir Menú de Acciones</Button>

        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title="Acciones de Cita"
          subtitle="Paciente: Carlos Mendoza (09:00)"
          snapPoint="auto"
        >
          <div className="space-y-1.5">
            {actions.map((act, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  alert(`Acción: ${act.title}`);
                  setOpen(false);
                }}
                className="w-full p-3 rounded-xl border border-[var(--border)]/60 bg-[var(--surface)] hover:bg-[var(--surface-subtle)] flex items-center gap-3.5 text-left transition-all active:scale-[0.98] cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${act.color}`}
                >
                  <span className="w-4 h-4">{act.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-xs sm:text-sm text-[var(--foreground)] block truncate">
                    {act.title}
                  </span>
                  <span className="text-[11px] text-[var(--muted)] block truncate">
                    {act.desc}
                  </span>
                </div>
                <span className="w-4 h-4 text-[var(--muted)] shrink-0">
                  {Icons.chevronRight}
                </span>
              </button>
            ))}
          </div>
        </BottomSheet>
      </div>
    );
  },
};

// ── Story 3: Formulario Compacto en Bottom Sheet ──────────────────────────────
export const InteractiveFormSheet: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [notes, setNotes] = useState("");

    return (
      <div className="p-4 text-center">
        <Button onClick={() => setOpen(true)}>Abrir Formulario Rápido</Button>

        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          eyebrow="Evolución Clínica"
          title="Agregar Nota de Sesión"
          subtitle="Tratamiento de Ortodoncia · Dra. Ana Silva"
          snapPoint="half"
          footer={
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="w-1/2"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="w-1/2"
                onClick={() => {
                  alert(`Nota guardada: ${notes}`);
                  setOpen(false);
                }}
              >
                Guardar Nota
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Registra los detalles del procedimiento realizado, indicaciones de
              higiene o medicamentos recetados.
            </p>
            <div>
              <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
                Observaciones clínicas *
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Cambio de arcos superiores 0.16 NiTi. Excelente higiene bucal..."
                className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              />
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  },
};

// ── Story 4: Modos de Altura / SnapPoints ──────────────────────────────────────
export const SnapPointModes: Story = {
  render: () => {
    const [snapPoint, setSnapPoint] = useState<BottomSheetSnapPoint>("compact");
    const [open, setOpen] = useState(false);

    const openWithSnap = (snap: BottomSheetSnapPoint) => {
      setSnapPoint(snap);
      setOpen(true);
    };

    return (
      <div className="p-4 flex flex-col items-center gap-3">
        <h3 className="text-sm font-bold text-[var(--foreground)]">
          Probar SnapPoints de BottomSheet
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openWithSnap("compact")}
          >
            Compact (~45% viewport)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openWithSnap("half")}
          >
            Half (~65% viewport)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openWithSnap("auto")}
          >
            Auto (Ajuste al contenido)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openWithSnap("full")}
          >
            Full (~94% viewport)
          </Button>
        </div>

        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={`SnapPoint: ${snapPoint.toUpperCase()}`}
          subtitle="Desliza hacia abajo o presiona ESC para cerrar"
          snapPoint={snapPoint}
          footer={
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setOpen(false)}
            >
              Entendido
            </Button>
          }
        >
          <div className="space-y-4 py-2">
            <p className="text-xs text-[var(--muted)]">
              Este modo de altura ({snapPoint}) está optimizado para
              dispositivos móviles con soporte para gestos táctiles de arrastre
              hacia abajo.
            </p>
            <div className="p-4 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs space-y-2">
              <span className="font-bold text-[var(--foreground)] block">
                Características incluidas:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
                <li>
                  Handle táctil con indicador de arrastre (`cursor-grab`).
                </li>
                <li>Detección de swipe-down con aceleración/velocidad.</li>
                <li>Backdrop desenfocado y bloqueo de scroll de fondo.</li>
                <li>Footer fijo para llamadas a la acción primarias.</li>
              </ul>
            </div>
          </div>
        </BottomSheet>
      </div>
    );
  },
};
