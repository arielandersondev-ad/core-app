"use client";

import { useEffect, useState } from "react";
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
  AppointmentApiError,
  cancelAppointment,
  fetchAppointmentById,
  updateAppointmentStatus,
  type AppointmentDto,
} from "@/modules/clinic/api/appointments";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Icons } from "@/shared/components/ui/Icons";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
import { RegisterPaymentModal } from "@/modules/clinic/components";
import {
  DentalWhatsAppContext,
  WhatsAppTemplateKey,
  normalizePhoneNumber,
} from "@/shared/utils/whatsapp-generator";

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

const reverseStatusMap: Record<AppointmentDto["status"], AppointmentStatus> = {
  SCHEDULED: "programada",
  CONFIRMED: "confirmada",
  WAITING_ROOM: "en_sala",
  IN_PROGRESS: "en_curso",
  COMPLETED: "completada",
  NO_SHOW: "no_asistio",
  CANCELLED: "cancelada",
};

const statusOptions: AppointmentStatus[] = [
  "programada",
  "confirmada",
  "en_sala",
  "en_curso",
  "completada",
  "no_asistio",
  "cancelada",
];

export default function AppointmentDetail({
  citaId,
  onNavigate,
}: {
  citaId: string;
  onNavigate: (view: string, params?: Record<string, string>) => void;
}) {
  const mockApt = appointments.find((a) => a.id === citaId);
  const [apiAppointment, setApiAppointment] = useState<AppointmentDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<{ message: string; notFound: boolean } | null>(null);

  const [status, setStatus] = useState<AppointmentStatus>(
    mockApt?.status ?? "programada",
  );
  const [sessionNotes, setSessionNotes] = useState(mockApt?.notes ?? "");
  const [sessionSaved, setSessionSaved] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // WhatsApp modal
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [waTemplate, setWaTemplate] = useState<WhatsAppTemplateKey>("confirmacion");

  // Payment prompt & modal
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    fetchAppointmentById(citaId)
      .then((result) => {
        if (!active) return;
        setApiAppointment(result);
        if (result.notes !== undefined && result.notes !== null) {
          setSessionNotes(result.notes);
        }
        setStatus(reverseStatusMap[result.status] ?? "programada");
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!mockApt) {
          setLoadError({
            message: error instanceof Error ? error.message : "No se pudo cargar la cita.",
            notFound: error instanceof AppointmentApiError && error.status === 404,
          });
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [citaId, mockApt]);

  if (loadError) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center" role="alert">
        <h2 className="font-display text-lg font-bold text-[var(--foreground)]">
          {loadError.notFound ? "Cita no encontrada" : "No se pudo cargar la cita"}
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">{loadError.message}</p>
        <button
          type="button"
          onClick={() => onNavigate("agenda")}
          className="mt-4 text-sm text-[var(--primary)] hover:underline"
        >
          Volver a la agenda
        </button>
      </div>
    );
  }

  if (isLoading && !mockApt && !apiAppointment) {
    return (
      <p className="p-8 text-center text-sm text-[var(--muted)]" role="status">
        Cargando detalle de la cita…
      </p>
    );
  }

  if (!mockApt && !apiAppointment) return null;

  const patientId = apiAppointment?.patientId || mockApt?.patientId || "";
  const mockPatient = getPatientById(patientId);
  const patient = mockPatient || (patientId ? {
    id: patientId,
    name: `Paciente ${patientId.slice(0, 8)}`,
    phone: "",
    allergies: [],
  } : null);

  const proId = apiAppointment?.professionalMembershipId || mockApt?.professionalId || "";
  const mockPro = getProfessionalById(proId);
  const pro = mockPro || {
    id: proId,
    name: "Odontólogo Tratante",
    specialty: "Odontología General",
    color: "#0ea5e9",
  };

  const rawServiceIds = apiAppointment?.serviceIds?.length
    ? apiAppointment.serviceIds
    : mockApt?.serviceIds?.length
    ? mockApt.serviceIds
    : [apiAppointment?.serviceId || mockApt?.serviceId || ""].filter(Boolean);

  const allServices = rawServiceIds
    .map((id) => getServiceById(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getServiceById>>[];

  const fallbackSvc = getServiceById(apiAppointment?.serviceId || mockApt?.serviceId || "") || {
    id: apiAppointment?.serviceId || mockApt?.serviceId || "default",
    name: "Consulta odontológica",
    price: 150,
    durationMin: 30,
    active: true,
  };

  const svc = allServices[0] || fallbackSvc;
  const serviceNamesTitle = allServices.length > 0 ? allServices.map((s) => s.name).join(" + ") : svc.name;
  const totalApptPrice = allServices.length > 0 ? allServices.reduce((sum, s) => sum + (s?.price || 0), 0) : svc.price;
  const totalApptDuration = allServices.length > 0 ? allServices.reduce((sum, s) => sum + (s?.durationMin || 0), 0) : svc.durationMin;
  const cleanPhone = normalizePhoneNumber(patient?.phone || "", "591");

  let dateFormatted = "";
  let timeRangeFormatted = "";
  if (apiAppointment?.startsAt) {
    const startDt = new Date(apiAppointment.startsAt);
    const endDt = new Date(apiAppointment.endsAt);
    dateFormatted = Number.isNaN(startDt.getTime())
      ? apiAppointment.startsAt
      : startDt.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" });
    const startTimeStr = Number.isNaN(startDt.getTime())
      ? ""
      : startDt.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
    const endTimeStr = Number.isNaN(endDt.getTime())
      ? ""
      : endDt.toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" });
    timeRangeFormatted = `${startTimeStr} – ${endTimeStr}`;
  } else if (mockApt) {
    const dt = new Date(mockApt.date + "T12:00:00");
    dateFormatted = dt.toLocaleDateString("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    timeRangeFormatted = `${mockApt.startTime} – ${mockApt.endTime}`;
  }

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setStatus(newStatus);
    setIsUpdating(true);
    setFeedbackMessage(null);

    try {
      if (newStatus === "cancelada") {
        await cancelAppointment(citaId, {
          reason: cancelReason.trim() || "Cancelación solicitada desde la interfaz",
        });
      } else {
        await updateAppointmentStatus(citaId, {
          status: backendStatusMap[newStatus] as any,
          notes: sessionNotes,
        });
      }
      setFeedbackMessage("Estado actualizado correctamente.");
    } catch (_err) {
      setFeedbackMessage("Estado actualizado localmente.");
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
        await updateAppointmentStatus(citaId, {
          status: backendStatusMap[status] as any,
          notes: sessionNotes,
        });
      }
      setSessionSaved(true);
      setFeedbackMessage("Evolución guardada correctamente.");
    } catch (_err) {
      setSessionSaved(true);
      setFeedbackMessage("Evolución guardada localmente.");
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

  const waContext: DentalWhatsAppContext = {
    patientName: patient?.name || "Paciente",
    patientPhone: cleanPhone,
    serviceName: serviceNamesTitle || svc?.name || "Consulta Odontológica",
    dateStr: dateFormatted,
    timeStr: timeRangeFormatted.split("–")[0]?.trim() || "09:00",
    clinicName: "Clínica Dental",
    professionalName: pro?.name,
  };

  return (
    <PageContainer maxWidth="max-w-4xl" className="pb-20">
      <PageHeader
        title={serviceNamesTitle || svc?.name || "Detalle de Cita"}
        description={`Cita con ${patient?.name || "Paciente"} · ${dateFormatted}`}
        breadcrumbs={[
          { label: "Agenda", onClick: () => onNavigate("agenda") },
          { label: "Detalle de cita" },
        ]}
        badge={
          <span
            className={`inline-flex items-center px-3 py-1 text-xs font-mono font-bold rounded-full ${statusColors[status]}`}
          >
            {statusLabels[status]}
          </span>
        }
      />

      {/* Tarjeta de Resumen Clínico */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-[11px] font-mono text-[var(--muted)] mb-1 capitalize">
              {dateFormatted}
            </p>
            <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--foreground)]">
              {serviceNamesTitle || svc?.name || "Consulta odontológica"}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              ⏰ {timeRangeFormatted} · {totalApptDuration || svc?.durationMin || 30} min ·{" "}
              <strong className="text-[var(--primary)] font-mono">
                {formatCurrency(totalApptPrice || svc?.price || 0)}
              </strong>
            </p>
            {(apiAppointment?.reason || mockApt?.notes) && (
              <p className="text-xs text-[var(--muted)] mt-1">
                Motivo: {apiAppointment?.reason || mockApt?.notes}
              </p>
            )}
          </div>
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
            onClick={() => setIsPaymentModalOpen(true)}
            className="ml-auto h-10 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold hover:bg-[var(--primary-accent)] active:scale-95 shadow-xs transition-all flex items-center gap-1.5"
          >
            <span>💳 Cobrar atención</span>
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
                  {patient?.phone || "Sin teléfono registrado"}
                </p>
              </div>
            </div>

            {patient?.allergies && patient.allergies.length > 0 && (
              <div className="mt-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs">
                <strong>⚠️ Alergias reportadas:</strong>{" "}
                {patient.allergies.join(", ")}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onNavigate("paciente-detalle", { patientId })
            }
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

      {/* Selector de Estado Clínico */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-3">
          Actualizar Estado Clínico
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statusOptions.map((s) => {
            const isSelected = status === s;
            return (
              <button
                type="button"
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
                      isSelected
                        ? "bg-[var(--primary)]"
                        : "bg-[var(--muted)]/40"
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
            type="button"
            onClick={handleSaveNotes}
            disabled={isUpdating}
            className="h-10 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs sm:text-sm font-semibold hover:opacity-90 disabled:opacity-50 active:scale-95 transition-all shadow-xs"
          >
            Guardar evolución
          </button>
        </div>
      </div>

      {/* Cancelación de cita */}
      {status !== "cancelada" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs">
          <label
            htmlFor="cancel-reason"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            Cancelar cita
          </label>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Indica el motivo para registrar la cancelación.
          </p>
          <textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de la cancelación..."
            rows={2}
            maxLength={500}
            disabled={isUpdating}
            className="mt-3 w-full px-3.5 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-xs sm:text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
          />
          <button
            type="button"
            disabled={isUpdating || !cancelReason.trim()}
            onClick={() => handleStatusChange("cancelada")}
            className="mt-3 h-10 px-4 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 transition-all active:scale-95"
          >
            Cancelar cita
          </button>
        </div>
      )}

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
          setIsPaymentModalOpen(true);
        }}
        patientName={patient?.name || "Paciente"}
        serviceName={svc?.name || "Atención"}
        priceFormatted={formatCurrency(svc?.price || 0)}
      />

      <RegisterPaymentModal
        open={isPaymentModalOpen}
        initialPatientId={patientId}
        initialAmount={totalApptPrice || svc?.price}
        initialServiceId={svc?.id}
        initialConcept={`Cobro por ${serviceNamesTitle || svc?.name || "Atención odontológica"}`}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setFeedbackMessage("Pago registrado correctamente.");
        }}
      />
    </PageContainer>
  );
}
