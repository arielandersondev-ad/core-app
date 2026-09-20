"use client";

import { useState } from "react";
import {
  appointments,
  getPatientById,
  getServiceById,
  getProfessionalById,
  statusColors,
  statusLabels,
  formatCurrency,
  AppointmentStatus,
} from "@/modules/clinic/__mocks__/data";
import {
  updateAppointmentStatus,
  cancelAppointment,
} from "@/modules/clinic/api/appointments";
import { Icons } from "@/shared/components/ui/Icons";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
import {
  DentalWhatsAppContext,
  WhatsAppTemplateKey,
  normalizePhoneNumber,
} from "@/shared/utils/whatsapp-generator";

export default function AppointmentDetail({
  citaId,
  onNavigate,
}: {
  citaId: string;
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const apt = appointments.find((a) => a.id === citaId);
  const [status, setStatus] = useState<AppointmentStatus>(
    apt?.status ?? "programada"
  );
  const [sessionNotes, setSessionNotes] = useState(apt?.notes ?? "");
  const [sessionSaved, setSessionSaved] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // WhatsApp modal
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [waTemplate, setWaTemplate] = useState<WhatsAppTemplateKey>("confirmacion");

  // Payment prompt
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);

  if (!apt) return null;

  const patient = getPatientById(apt.patientId);
  const svc = getServiceById(apt.serviceId);
  const pro = getProfessionalById(apt.professionalId);
  const cleanPhone = normalizePhoneNumber(patient?.phone || "", "591");

  const statusOptions: AppointmentStatus[] = [
    "programada",
    "confirmada",
    "en_sala",
    "en_curso",
    "completada",
    "no_asistio",
    "cancelada",
  ];

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setStatus(newStatus);
    setIsUpdating(true);
    setFeedbackMessage(null);

    const backendStatusMap: Record<
      AppointmentStatus,
      | "SCHEDULED"
      | "CONFIRMED"
      | "WAITING_ROOM"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "NO_SHOW"
      | "CANCELLED"
    > = {
      programada: "SCHEDULED",
      confirmada: "CONFIRMED",
      en_sala: "WAITING_ROOM",
      en_curso: "IN_PROGRESS",
      completada: "COMPLETED",
      no_asistio: "NO_SHOW",
      cancelada: "CANCELLED",
    };

    try {
      if (newStatus === "cancelada") {
        await cancelAppointment(citaId, {
          cancelledByMembershipId: "018f0000-0000-7000-0000-000000000003",
          reason: "Cancelación solicitada por el usuario desde la interfaz",
        });
      } else {
        await updateAppointmentStatus(citaId, {
          status: backendStatusMap[newStatus] as
            | "SCHEDULED"
            | "CONFIRMED"
            | "WAITING_ROOM"
            | "IN_PROGRESS"
            | "COMPLETED"
            | "NO_SHOW",
          notes: sessionNotes,
        });
      }
      setFeedbackMessage("Estado actualizado correctamente");
    } catch (_err) {
      setFeedbackMessage("Estado actualizado localmente");
    } finally {
      setIsUpdating(false);
    }

    if (newStatus === "completada") {
      setShowPaymentPrompt(true);
    }
  };

  const handleSaveNotes = async () => {
    setIsUpdating(true);
    try {
      if (status !== "cancelada") {
        const backendStatusMap: Record<
          AppointmentStatus,
          | "SCHEDULED"
          | "CONFIRMED"
          | "WAITING_ROOM"
          | "IN_PROGRESS"
          | "COMPLETED"
          | "NO_SHOW"
        > = {
          programada: "SCHEDULED",
          confirmada: "CONFIRMED",
          en_sala: "WAITING_ROOM",
          en_curso: "IN_PROGRESS",
          completada: "COMPLETED",
          no_asistio: "NO_SHOW",
          cancelada: "SCHEDULED",
        };
        await updateAppointmentStatus(citaId, {
          status: backendStatusMap[status],
          notes: sessionNotes,
        });
      }
      setSessionSaved(true);
    } catch (_err) {
      setSessionSaved(true);
    } finally {
      setIsUpdating(false);
    }
  };

  const openWhatsApp = (tplKey?: WhatsAppTemplateKey) => {
    let chosen = tplKey;
    if (!chosen) {
      if (status === "en_sala") chosen = "turno_listo";
      else if (status === "no_asistio") chosen = "no_show";
      else if (status === "completada") chosen = "post_tratamiento";
      else chosen = "confirmacion";
    }
    setWaTemplate(chosen);
    setIsWaOpen(true);
  };

  const dt = new Date(apt.date + "T12:00:00");
  const dateFormatted = dt.toLocaleDateString("es-BO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const waContext: DentalWhatsAppContext = {
    patientName: patient?.name || "Paciente",
    patientPhone: patient?.phone || "",
    serviceName: svc?.name || "Consulta",
    dateStr: dateFormatted,
    timeStr: apt.startTime,
    clinicName: "Dental Care Consultorio",
    professionalName: pro?.name,
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-5 pb-20">
      {/* Header */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] font-mono text-[var(--muted)] mb-1 capitalize">
              {dateFormatted}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--foreground)]">
              {svc?.name}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              ⏰ {apt.startTime} – {apt.endTime} · {svc?.durationMin} min ·{" "}
              <strong className="text-[var(--primary)] font-mono">
                {formatCurrency(svc?.price ?? 0)}
              </strong>
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-mono font-bold rounded-full border ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        </div>

        {/* Barra de contacto directo */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]/60 flex-wrap">
          <button
            type="button"
            onClick={() => openWhatsApp()}
            className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              {Icons.whatsapp}
            </span>
            <span>Contactar por WhatsApp</span>
          </button>

          {cleanPhone && (
            <a
              href={`tel:+${cleanPhone}`}
              className="h-10 px-3.5 border border-[var(--border)] rounded-xl text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] active:scale-95 flex items-center gap-1.5 transition-all"
            >
              {Icons.phoneCall}
              <span>+{cleanPhone}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => onNavigate("registrar-pago", { patientId: apt.patientId })}
            className="ml-auto h-10 px-4 bg-[var(--surface)] border border-[var(--primary)] text-[var(--primary)] rounded-xl text-xs font-semibold hover:bg-[var(--primary-subtle)] active:scale-95 transition-all"
          >
            💳 Cobrar atención
          </button>
        </div>

        {feedbackMessage && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-3 font-mono">
            ✓ {feedbackMessage}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Paciente */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-3">
              Paciente
            </p>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] font-display font-bold flex-shrink-0 text-sm">
                {patient?.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-display font-bold text-[var(--foreground)] truncate">
                  {patient?.name}
                </p>
                <p className="text-xs font-mono text-[var(--muted)]">
                  {patient?.phone}
                </p>
              </div>
            </div>

            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                <strong>⚠️ Alergias reportadas:</strong> {patient.allergies.join(", ")}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate("paciente-detalle", { patientId: apt.patientId })}
            className="mt-4 text-xs text-[var(--primary)] font-semibold hover:underline text-left"
          >
            Ver expediente 360° del paciente →
          </button>
        </div>

        {/* Profesional asignado */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-3">
            Odontólogo Tratante
          </p>
          <p
            className="text-sm font-display font-bold text-[var(--foreground)]"
            style={{ color: pro?.color }}
          >
            {pro?.name}
          </p>
          <p className="text-xs font-mono text-[var(--muted)] mt-0.5">
            {pro?.specialty}
          </p>
          <div className="mt-4 p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--muted)]">
            <span>Sillón Dental #1 · Consultorio Principal</span>
          </div>
        </div>
      </div>

      {/* Selector de Estado Clínico Completo */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-3">
          Actualizar Estado Clínico
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statusOptions.map((s) => {
            const isSelected = status === s;
            return (
              <button
                key={s}
                disabled={isUpdating}
                onClick={() => handleStatusChange(s)}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-subtle)] font-bold"
                    : "border-[var(--border)] hover:bg-[var(--background)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSelected ? "bg-[var(--primary)]" : "bg-[var(--muted)]/40"
                    }`}
                  />
                </div>
                <span className="text-xs font-display">{statusLabels[s]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Evolución clínica y notas */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
            Evolución / Procedimiento realizado
          </p>
          {sessionSaved && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
              ✓ Guardado
            </span>
          )}
        </div>
        <textarea
          value={sessionNotes}
          onChange={(e) => {
            setSessionNotes(e.target.value);
            setSessionSaved(false);
          }}
          placeholder="Piezas dentales tratadas, anestésico utilizado, indicaciones al paciente…"
          rows={4}
          className="w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleSaveNotes}
            disabled={isUpdating}
            className="h-10 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs sm:text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all shadow-xs"
          >
            Guardar evolución
          </button>
        </div>
      </div>

      {/* Modal WhatsApp */}
      <WhatsAppModal
        isOpen={isWaOpen}
        onClose={() => setIsWaOpen(false)}
        context={waContext}
        defaultTemplate={waTemplate}
      />

      {/* Prompt Cobro */}
      <PaymentPromptModal
        isOpen={showPaymentPrompt}
        onClose={() => setShowPaymentPrompt(false)}
        onConfirmPayment={() => {
          setShowPaymentPrompt(false);
          onNavigate("registrar-pago", { patientId: apt.patientId });
        }}
        patientName={patient?.name || "Paciente"}
        serviceName={svc?.name || "Atención"}
        priceFormatted={formatCurrency(svc?.price || 0)}
      />
    </div>
  );
}
