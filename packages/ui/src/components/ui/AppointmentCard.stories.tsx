import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Card,
  Badge,
  ContactTypeBadge,
  AppointmentStatusBadge,
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

// Modelo estándar de presentación de citas para Storybook
interface AppointmentCardModel {
  id: string;
  startTime: string;
  endTime: string;
  durationMin?: number;
  status: "SCHEDULED" | "CONFIRMED" | "WAITING_ROOM" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" | "CANCELED";
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

// Componente presentacional puro para la historia y reutilización
function AppointmentCardDemo({
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
      {/* Alerta destacada de alergias si es paciente registrado */}
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

              {/* Badge de tipo de contacto: Paciente vs Persona */}
              <ContactTypeBadge
                type={appointment.contactType}
                size="sm"
                dot
              />
            </div>

            {/* Teléfono directo visible 📞 */}
            {appointment.phone && (
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
                <span className="text-[var(--primary)]" aria-label="Teléfono">📞</span>
                <span>{appointment.phone}</span>
              </div>
            )}

            {/* Servicio y Odontólogo asignado */}
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

            {/* Notas / Motivo opcional truncado */}
            {appointment.notes && (
              <p className="text-xs text-[var(--muted)] italic line-clamp-1 pt-0.5">
                "{appointment.notes}"
              </p>
            )}
          </div>

          {/* Precio formateado multi-moneda */}
          {appointment.servicePrice !== undefined && (
            <span className="font-mono text-xs font-semibold text-[var(--muted)] shrink-0 pt-0.5">
              {formatCurrency(appointment.servicePrice, { currency: "BOB" })}
            </span>
          )}
        </div>
      </div>

      {/* Barra de Acciones Táctiles Rápidas */}
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

          {appointment.status === "CONFIRMED" && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => onStatusChange?.("WAITING_ROOM")}
              className="h-8 px-3 text-xs font-semibold gap-1"
            >
              <span>A sala de espera</span>
            </Button>
          )}

          {appointment.status === "WAITING_ROOM" && (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={() => onStatusChange?.("IN_PROGRESS")}
              className="h-8 px-3 text-xs font-semibold gap-1"
            >
              <span>Pasar al sillón</span>
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

// ─────────────────────────────────────────────────────────────────────────────
// CASO 1: Cita Completa con Odontólogo Asignado, Tratamiento Específico y Alergias
// ─────────────────────────────────────────────────────────────────────────────
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
        <AppointmentCardDemo
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

// ─────────────────────────────────────────────────────────────────────────────
// CASO 2: Cita Ligera / Ingreso Rápido (Sin odontólogo, Evaluación general, Persona)
// ─────────────────────────────────────────────────────────────────────────────
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
      practitioner: null, // Sin asignar (píldora gris 'Por asignar')
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
        <AppointmentCardDemo
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

// ─────────────────────────────────────────────────────────────────────────────
// VISTA COMPARATIVA: Agenda Móvil con Ambos Casos
// ─────────────────────────────────────────────────────────────────────────────
export const AgendaComparativaAmbosCasos: Story = {
  render: () => {
    const appointments: AppointmentCardModel[] = [
      {
        id: "0194d3f0-2001-7000-8000-000000000001",
        startTime: "09:00",
        endTime: "09:45",
        durationMin: 45,
        status: "CONFIRMED",
        contactType: "patient",
        contactName: "Ana Cristina Vidal Torres",
        phone: "+591 71234567",
        serviceName: "Endodoncia Unirradicular Mecanizada",
        servicePrice: 450,
        practitioner: {
          name: "Dra. Valeria Quiroga",
          color: "#9a744f",
        },
        allergies: ["Penicilina"],
        notes: "Paciente alérgica estricta a penicilina.",
      },
      {
        id: "0194d3f0-2002-7000-8000-000000000002",
        startTime: "10:30",
        endTime: "11:00",
        durationMin: 30,
        status: "SCHEDULED",
        contactType: "person",
        contactName: "Gonzalo Mercado Prado",
        phone: "+591 78912345",
        serviceName: "Consulta / Evaluación general",
        servicePrice: 80,
        practitioner: null,
        notes: "Ingreso rápido en recepción para diagnóstico preliminar.",
      },
    ];

    return (
      <div className="w-full max-w-2xl p-4 space-y-4">
        <div className="p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between">
          <div>
            <h4 className="font-display font-bold text-sm text-[var(--foreground)]">
              Agenda del Día (Vista Móvil)
            </h4>
            <p className="text-xs text-[var(--muted)]">
              Comparativa visual: Paciente registrado con historia clínica vs Registro rápido de Persona
            </p>
          </div>
          <div className="flex gap-2">
            <ContactTypeBadge type="patient" size="sm" />
            <ContactTypeBadge type="person" size="sm" />
          </div>
        </div>

        <div className="space-y-3">
          {appointments.map((apt) => (
            <AppointmentCardDemo
              key={apt.id}
              appointment={apt}
              onWhatsApp={() => alert(`WhatsApp a ${apt.contactName}`)}
              onCall={() => alert(`Llamada a ${apt.phone}`)}
              onViewDetail={() => alert(`Detalle ${apt.id}`)}
            />
          ))}
        </div>
      </div>
    );
  },
};
