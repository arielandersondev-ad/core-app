"use client";

import { useEffect, useState } from "react";
import {
  AppointmentApiError,
  cancelAppointment,
  fetchAppointmentById,
  updateAppointmentStatus,
  type AppointmentDto,
} from "@/modules/clinic/api/appointments";

type ChangeableStatus = Exclude<AppointmentDto["status"], "CANCELLED">;

const STATUS_LABELS: Record<AppointmentDto["status"], string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  WAITING_ROOM: "En sala de espera",
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
  CANCELLED: "Cancelada",
};

const CHANGEABLE_STATUSES: ChangeableStatus[] = [
  "SCHEDULED", "CONFIRMED", "WAITING_ROOM", "IN_PROGRESS", "COMPLETED", "NO_SHOW",
];

export default function AppointmentDetail({ citaId, onNavigate }: {
  citaId: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}) {
  const [appointment, setAppointment] = useState<AppointmentDto | null>(null);
  const [loadError, setLoadError] = useState<{ message: string; notFound: boolean } | null>(null);
  const [notes, setNotes] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

  useEffect(() => {
    let active = true;
    fetchAppointmentById(citaId)
      .then((result) => {
        if (!active) return;
        setAppointment(result);
        setNotes(result.notes ?? "");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError({
          message: error instanceof Error ? error.message : "No se pudo cargar la cita.",
          notFound: error instanceof AppointmentApiError && error.status === 404,
        });
      });
    return () => { active = false; };
  }, [citaId]);

  async function applyChange(action: () => Promise<unknown>, successMessage: string) {
    setIsUpdating(true);
    setFeedback(null);
    try {
      await action();
      const updated = await fetchAppointmentById(citaId);
      setAppointment(updated);
      setNotes(updated.notes ?? "");
      setFeedback({ message: successMessage, error: false });
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : "No se pudo actualizar la cita.", error: true });
    } finally {
      setIsUpdating(false);
    }
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center" role="alert">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
          {loadError.notFound ? "Cita no encontrada" : "No se pudo cargar la cita"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{loadError.message}</p>
        <button type="button" onClick={() => onNavigate("agenda")} className="mt-4 text-sm text-[var(--primary)] hover:underline">Volver a la agenda</button>
      </div>
    );
  }

  if (!appointment) {
    return <p className="p-8 text-center text-sm text-[var(--muted)]" role="status">Cargando detalle de la cita…</p>;
  }

  const startsAt = new Date(appointment.startsAt);
  const endsAt = new Date(appointment.endsAt);
  const dateLabel = Number.isNaN(startsAt.getTime()) ? appointment.startsAt :
    startsAt.toLocaleString("es-BO", { dateStyle: "full", timeStyle: "short" });
  const endLabel = Number.isNaN(endsAt.getTime()) ? appointment.endsAt :
    endsAt.toLocaleTimeString("es-BO", { timeStyle: "short" });
  const cancelled = appointment.status === "CANCELLED";

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-5 pb-20">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-mono text-[var(--muted)]">{dateLabel} – {endLabel}</p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--foreground)] mt-1">Detalle de cita</h2>
            <p className="text-xs text-[var(--muted)] mt-1">{appointment.reason || "Sin motivo registrado"}</p>
          </div>
          <span className="text-xs font-semibold rounded-full border border-[var(--border)] px-3 py-1">{STATUS_LABELS[appointment.status]}</span>
        </div>
        {feedback && <p role="status" className={`mt-4 text-sm ${feedback.error ? "text-red-600" : "text-emerald-600"}`}>{feedback.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Paciente</p>
          <p className="mt-2 text-sm text-[var(--foreground)]">ID: {appointment.patientId}</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Servicio y profesional</p>
          <p className="mt-2 text-sm text-[var(--foreground)]">Servicio: {appointment.serviceId}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Membresía profesional: {appointment.professionalMembershipId}</p>
        </div>
      </div>

      {!cancelled && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Actualizar estado clínico</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
            {CHANGEABLE_STATUSES.map((status) => (
              <button type="button" key={status} disabled={isUpdating || appointment.status === status}
                onClick={() => applyChange(() => updateAppointmentStatus(citaId, { status, notes }), "Estado actualizado correctamente.")}
                className="p-3 rounded-xl text-left text-xs border border-[var(--border)] hover:bg-[var(--background)] disabled:opacity-50">
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <label htmlFor="appointment-notes" className="text-sm font-semibold text-[var(--foreground)]">Notas de la cita</label>
        <textarea id="appointment-notes" value={notes} disabled={cancelled || isUpdating}
          onChange={(event) => setNotes(event.target.value)} rows={4}
          className="mt-3 w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] disabled:opacity-60" />
        <button type="button" disabled={cancelled || isUpdating || notes === (appointment.notes ?? "")}
          onClick={() => applyChange(() => updateAppointmentStatus(citaId, { status: appointment.status as ChangeableStatus, notes }), "Notas guardadas correctamente.")}
          className="mt-3 h-10 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-sm font-semibold disabled:opacity-50">
          Guardar notas
        </button>
      </div>

      {!cancelled && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <label htmlFor="cancel-reason" className="text-sm font-semibold text-[var(--foreground)]">Cancelar cita</label>
          <p className="mt-1 text-xs text-[var(--muted)]">Indica el motivo para registrar la cancelación.</p>
          <textarea id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)}
            rows={2} maxLength={500} disabled={isUpdating}
            className="mt-3 w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)]" />
          <button type="button" disabled={isUpdating || !cancelReason.trim()}
            onClick={() => applyChange(() => cancelAppointment(citaId, { reason: cancelReason.trim() }), "Cita cancelada correctamente.")}
            className="mt-3 h-10 px-4 border border-red-600 text-red-600 rounded-xl text-sm font-semibold disabled:opacity-50">
            Cancelar cita
          </button>
        </div>
      )}
    </div>
  );
}
