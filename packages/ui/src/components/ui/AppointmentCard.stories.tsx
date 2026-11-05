import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  AppointmentTimelineItem,
  AppointmentTimelineItemData,
  AppointmentTimelineStatus,
  ContactTypeBadge,
  AppointmentStatusBadge,
  Badge,
  Button,
  Icons,
  formatCurrency,
} from "../../index";

const meta: Meta = {
  title: "Design System/AppointmentCard",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// ─────────────────────────────────────────────────────────────────────────────
// HISTORIA PRINCIPAL 1:1 CON LA IMAGEN DE REFERENCIA (paste-1793904355673.png)
// Riel de Timeline lateral (Hora mono + punto de estado + línea vertical conectora)
// Tarjetas acordeón colapsables/expandibles con acciones táctiles
// ─────────────────────────────────────────────────────────────────────────────
export const TimelineAgendaView: Story = {
  render: () => {
    // Estado de ítems expandidos (por defecto María Fernández Cruz a las 05:00 está abierta)
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
      "apt-1": true,
      "apt-2": false,
      "apt-3": false,
      "apt-4": false,
      "apt-5": false,
    });

    const [appointments, setAppointments] = useState<AppointmentTimelineItemData[]>([
      {
        id: "apt-1",
        startTime: "05:00",
        durationMin: 45,
        status: "SCHEDULED", // Punto ámbar (amarillo)
        contactName: "María Fernández Cruz",
        phone: "+591 71234567",
        serviceName: "Evaluación general",
        notes: "Prueba de cita real en BD",
      },
      {
        id: "apt-2",
        startTime: "05:45",
        durationMin: 30,
        status: "CONFIRMED", // Punto verde
        contactName: "Jorge Mamani Quispe",
        phone: "+591 78912345",
        serviceName: "Limpieza dental",
      },
      {
        id: "apt-3",
        startTime: "06:30",
        durationMin: 60,
        status: "SCHEDULED", // Punto ámbar
        contactName: "Lucía Rojas Vargas",
        phone: "+591 67890123",
        serviceName: "Endodoncia · control",
        notes: "Sensibilidad en molar inf. der.",
      },
      {
        id: "apt-4",
        startTime: "07:30",
        durationMin: 30,
        status: "SCHEDULED", // Punto ámbar
        contactName: "Carlos Choque Apaza",
        phone: "+591 76543210",
        serviceName: "Extracción 3.8",
      },
      {
        id: "apt-5",
        startTime: "08:00",
        durationMin: 45,
        status: "CONFIRMED", // Punto verde
        contactName: "Rosa Quispe Mamani",
        phone: "+591 70011223",
        serviceName: "Ortodoncia · ajuste",
      },
    ]);

    const toggleExpand = (id: string) => {
      setExpandedIds((prev) => ({
        ...prev,
        [id]: !prev[id],
      }));
    };

    const handleConfirm = (id: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: "CONFIRMED" } : apt
        )
      );
    };

    const handleNoShow = (id: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === id ? { ...apt, status: "NO_SHOW" } : apt
        )
      );
    };

    return (
      <div className="w-full max-w-sm sm:max-w-md mx-auto p-4 bg-zinc-950 text-zinc-100 rounded-3xl shadow-2xl border border-zinc-800/80">
        <div className="mb-4 px-2 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-zinc-100 font-display">
              Timeline de Citas
            </h3>
            <p className="text-[11px] text-zinc-400">
              Vista móvil 1:1 con tarjetas colapsables
            </p>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            5 citas
          </span>
        </div>

        <div className="flex flex-col">
          {appointments.map((apt, index) => (
            <AppointmentTimelineItem
              key={apt.id}
              appointment={apt}
              isExpanded={expandedIds[apt.id] || false}
              onToggleExpand={() => toggleExpand(apt.id)}
              onNameClick={() => alert(`Ficha de paciente: ${apt.contactName}`)}
              isLast={index === appointments.length - 1}
              onConfirm={() => handleConfirm(apt.id)}
              onNoShow={() => handleNoShow(apt.id)}
              onWhatsApp={() => alert(`WhatsApp a ${apt.contactName}`)}
              onCall={() => alert(`Llamada a ${apt.contactName}`)}
            />
          ))}
        </div>
      </div>
    );
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CASO COMPLETO Y DETALLADO: Cita Completa vs Cita Ligera con Badges
// ─────────────────────────────────────────────────────────────────────────────
interface AppointmentCardModel {
  id: string;
  startTime: string;
  endTime: string;
  durationMin?: number;
  status: AppointmentTimelineStatus;
  contactType: "patient" | "person";
  contactName: string;
  phone?: string;
  serviceName: string;
  servicePrice?: number;
  practitioner?: {
    name: string;
    color?: string;
  } | null;
  allergies?: string[];
  notes?: string;
}

function AppointmentCardLegacyDemo({
  appointment,
  onWhatsApp,
  onCall,
  onViewDetail,
  onStatusChange,
}: {
  appointment: AppointmentCardModel;
  onWhatsApp?: () => void;
  onCall?: () => void;
  onViewDetail?: () => void;
  onStatusChange?: (newStatus: string) => void;
}) {
  const isPatient = appointment.contactType === "patient";

  return (
    <div
      data-testid={`appointment-card-${appointment.id}`}
      className="group w-full max-w-xl bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[var(--primary)]/30 transition-all flex flex-col gap-3.5 relative"
    >
      {/* Alerta de alergias si es paciente registrado */}
      {isPatient && appointment.allergies && appointment.allergies.length > 0 && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-medium border border-rose-500/20 self-start">
          <span className="w-3.5 h-3.5 flex items-center justify-center text-rose-600 dark:text-rose-400">
            {Icons.alertTriangle}
          </span>
          <span>Alergias: {appointment.allergies.join(", ")}</span>
        </span>
      )}

      {/* Encabezado: Horario, Duración y Estado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-base font-bold text-[var(--foreground)]">
              {appointment.startTime}
            </span>
            <span className="text-xs text-[var(--muted)] font-mono">
              – {appointment.endTime}
            </span>
          </div>
          {appointment.durationMin && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[var(--background)] text-[var(--muted)] border border-[var(--border)]/70">
              {appointment.durationMin} min
            </span>
          )}
        </div>

        <AppointmentStatusBadge status={appointment.status} size="sm" />
      </div>

      {/* Detalle del Titular / Contacto */}
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onViewDetail}
                className="text-left font-display text-base font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer"
              >
                {appointment.contactName}
              </button>

              <ContactTypeBadge
                type={appointment.contactType}
                size="sm"
                dot
              />
            </div>

            {appointment.phone && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
                <span className="text-[var(--primary)]" aria-label="Teléfono">📞</span>
                <span>{appointment.phone}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap pt-0.5">
              <span className="font-medium text-[var(--foreground)]/85">
                {appointment.serviceName}
              </span>
              <span className="text-[var(--border)]">|</span>
              {appointment.practitioner ? (
                <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor: appointment.practitioner.color || "#3d7a46",
                    }}
                  />
                  <span className="font-medium">{appointment.practitioner.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--neutral-subtle)] text-[var(--muted)] text-[10px] font-medium border border-[var(--border)]">
                  Por asignar
                </span>
              )}
            </div>

            {appointment.notes && (
              <p className="text-xs text-[var(--muted)] italic line-clamp-1 pt-0.5">
                "{appointment.notes}"
              </p>
            )}
          </div>

          {appointment.servicePrice !== undefined && (
            <span className="font-mono text-xs font-semibold text-[var(--muted)] shrink-0 pt-0.5">
              {formatCurrency(appointment.servicePrice, { currency: "BOB" })}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Acciones */}
      <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onWhatsApp}
            className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 cursor-pointer"
          >
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {Icons.whatsappReal}
            </span>
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>

          {appointment.phone && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onCall}
              className="h-8 w-8 p-0 shrink-0 text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
              title={`Llamar a ${appointment.contactName}`}
            >
              <span className="w-4 h-4 flex items-center justify-center">
                {Icons.phoneCall}
              </span>
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {appointment.status === "SCHEDULED" && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onStatusChange?.("CONFIRMED")}
              className="h-8 px-3 text-xs font-semibold gap-1"
            >
              <span className="w-3.5 h-3.5 flex items-center justify-center">
                {Icons.check}
              </span>
              <span>Confirmar cita</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onViewDetail}
            className="h-8 w-8 p-0 text-[var(--muted)] hover:text-[var(--foreground)]"
            title="Ver detalle de cita"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {Icons.chevronRight}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export const CitaCompleta: Story = {
  render: () => {
    const [status, setStatus] = useState<AppointmentCardModel["status"]>("CONFIRMED");

    const sampleAppointment: AppointmentCardModel = {
      id: "0194d3f0-2001-7000-8000-000000000001",
      startTime: "09:00",
      endTime: "09:45",
      durationMin: 45,
      status,
      contactType: "patient",
      contactName: "Ana Cristina Vidal Torres",
      phone: "+591 71234567",
      serviceName: "Endodoncia Unirradicular Mecanizada",
      servicePrice: 450,
      practitioner: {
        name: "Dra. Valeria Quiroga",
        color: "#9a744f",
      },
      allergies: ["Penicilina", "Ibuprofeno"],
      notes: "Paciente con hipersensibilidad dentinaria severa en sector anterosuperior.",
    };

    return (
      <div className="w-full p-4 flex flex-col items-center">
        <div className="w-full max-w-xl mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Caso 1: Cita Completa (Paciente Registrado)
          </span>
          <Badge variant="patient" dot>
            Paciente
          </Badge>
        </div>
        <AppointmentCardLegacyDemo
          appointment={sampleAppointment}
          onWhatsApp={() => alert(`Enviar WhatsApp a ${sampleAppointment.contactName}`)}
          onCall={() => alert(`Llamar al ${sampleAppointment.phone}`)}
          onViewDetail={() => alert(`Ver detalle de cita: ${sampleAppointment.id}`)}
          onStatusChange={(next) => setStatus(next as AppointmentCardModel["status"])}
        />
      </div>
    );
  },
};

export const CitaLigeraIngresoRapido: Story = {
  render: () => {
    const [status, setStatus] = useState<AppointmentCardModel["status"]>("SCHEDULED");

    const sampleAppointment: AppointmentCardModel = {
      id: "0194d3f0-2002-7000-8000-000000000002",
      startTime: "11:30",
      endTime: "12:00",
      durationMin: 30,
      status,
      contactType: "person",
      contactName: "Gonzalo Mercado Prado",
      phone: "+591 78912345",
      serviceName: "Consulta / Evaluación general",
      servicePrice: 80,
      practitioner: null,
      notes: "Acudió a recepción por dolor leve en molar superior izquierdo.",
    };

    return (
      <div className="w-full p-4 flex flex-col items-center">
        <div className="w-full max-w-xl mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Caso 2: Cita Ligera / Ingreso Rápido (Persona)
          </span>
          <Badge variant="person" dot>
            Persona
          </Badge>
        </div>
        <AppointmentCardLegacyDemo
          appointment={sampleAppointment}
          onWhatsApp={() => alert(`Enviar WhatsApp a ${sampleAppointment.contactName}`)}
          onCall={() => alert(`Llamar al ${sampleAppointment.phone}`)}
          onViewDetail={() => alert(`Ver detalle de cita: ${sampleAppointment.id}`)}
          onStatusChange={(next) => setStatus(next as AppointmentCardModel["status"])}
        />
      </div>
    );
  },
};
