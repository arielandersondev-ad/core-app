"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getPatientById,
  getServiceById,
  getProfessionalById,
  statusColors,
  statusLabels,
  TODAY_DATE,
  Appointment,
  AppointmentStatus,
  formatCurrency,
} from "@/modules/clinic/__mocks__/data";
import {
  fetchAppointments,
  updateAppointmentStatus,
  AppointmentDto,
} from "@/modules/clinic/api/appointments";
import { Icons } from "@/shared/components/ui/Icons";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
import { CreateAppointmentModal, RegisterPaymentModal } from "@/modules/clinic/components";
import {
  DentalWhatsAppContext,
  WhatsAppTemplateKey,
  normalizePhoneNumber,
} from "@/shared/utils/whatsapp-generator";

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

const HOURS = Array.from(
  { length: 12 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`,
);

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const statusMap: Record<string, AppointmentStatus> = {
  SCHEDULED: "programada",
  CONFIRMED: "confirmada",
  WAITING_ROOM: "en_sala",
  IN_PROGRESS: "en_curso",
  COMPLETED: "completada",
  NO_SHOW: "no_asistio",
  CANCELLED: "cancelada",
};

type QuickStatus = Exclude<AppointmentStatus, "cancelada">;

const backendStatusMap: Record<
  QuickStatus,
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
};

const statusDotColors: Record<AppointmentStatus, string> = {
  programada: "bg-stone-400 dark:bg-stone-500",
  confirmada: "bg-emerald-600 dark:bg-emerald-400",
  en_sala: "bg-[var(--secondary)]",
  en_curso: "bg-amber-600 dark:bg-amber-400",
  completada: "bg-zinc-400",
  no_asistio: "bg-orange-500",
  cancelada: "bg-rose-500",
};

function mapDtoToAppointment(dto: AppointmentDto): Appointment {
  const startDate = new Date(dto.startsAt);
  const endDate = new Date(dto.endsAt);
  const startTime = startDate.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endTime = endDate.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const serviceIds =
    dto.services && dto.services.length > 0
      ? dto.services.map((s) => s.serviceId)
      : dto.serviceIds && dto.serviceIds.length > 0
        ? dto.serviceIds
        : [dto.serviceId];

  return {
    id: dto.id,
    patientId: dto.patientId,
    professionalId: dto.professionalMembershipId,
    serviceId: dto.serviceId,
    serviceIds,
    date: dto.startsAt.slice(0, 10),
    startTime,
    endTime,
    status: statusMap[dto.status] ?? "programada",
    notes: dto.notes ?? "",
  };
}

export default function Agenda({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [date, setDate] = useState(TODAY_DATE);
  const [proFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const changeDate = (nextDate: string) => {
    setIsLoading(true);
    setLoadError(null);
    setDate(nextDate);
  };

  // WhatsApp Modal State
  const [waContext, setWaContext] = useState<DentalWhatsAppContext | null>(
    null,
  );
  const [waTemplate, setWaTemplate] =
    useState<WhatsAppTemplateKey>("confirmacion");
  const [isWaOpen, setIsWaOpen] = useState(false);

  // Payment Prompt Modal State
  const [paymentPromptAppointment, setPaymentPromptAppointment] =
    useState<Appointment | null>(null);

  // Modals de creación integrados
  const [isCreateApptOpen, setIsCreateApptOpen] = useState(false);
  const [paymentModalState, setPaymentModalState] = useState<{
    open: boolean;
    patientId?: string;
    amount?: number;
    serviceId?: string;
    concept?: string;
  }>({ open: false });

  useEffect(() => {
    let isMounted = true;
    fetchAppointments({
      date,
    })
      .then((dtos) => {
        if (isMounted) {
          setAppointmentsList(dtos.map(mapDtoToAppointment));
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppointmentsList([]);
          setLoadError("No se pudo cargar la agenda. Inténtalo nuevamente.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [date]);

  // Actualizar estado de cita de forma reactiva en UI y backend
  const handleQuickStatusChange = async (
    aptId: string,
    newStatus: QuickStatus,
  ) => {
    const apt = appointmentsList.find((a) => a.id === aptId);
    if (!apt) return;

    // Actualización optimista local
    setAppointmentsList((prev) =>
      prev.map((a) => (a.id === aptId ? { ...a, status: newStatus } : a)),
    );

    try {
      await updateAppointmentStatus(aptId, {
        status: backendStatusMap[newStatus],
        notes: apt.notes,
      });
    } catch {
      setAppointmentsList((prev) =>
        prev.map((item) => item.id === aptId ? apt : item),
      );
    }

    // Si la cita pasó a completada, abrir prompt de cobro automático
    if (newStatus === "completada") {
      setPaymentPromptAppointment({ ...apt, status: "completada" });
    }
  };

  const handleOpenWhatsApp = (apt: Appointment) => {
    const patient = getPatientById(apt.patientId);
    const svc = getServiceById(apt.serviceId);
    const pro = getProfessionalById(apt.professionalId);

    if (!patient || !svc) return;

    const dt = new Date(apt.date + "T12:00:00");
    const dateFormatted = dt.toLocaleDateString("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    let defaultTpl: WhatsAppTemplateKey = "confirmacion";
    if (apt.status === "en_sala") defaultTpl = "turno_listo";
    else if (apt.status === "no_asistio") defaultTpl = "no_show";
    else if (apt.status === "completada") defaultTpl = "post_tratamiento";

    setWaContext({
      patientName: patient.name,
      patientPhone: patient.phone,
      serviceName: svc.name,
      dateStr: dateFormatted,
      timeStr: apt.startTime,
      clinicName: "Dental Care Consultorio",
      professionalName: pro?.name,
    });
    setWaTemplate(defaultTpl);
    setIsWaOpen(true);
  };

  const dayAppts = useMemo(() => {
    return appointmentsList.filter((a) => {
      const matchPro = proFilter === "all" || a.professionalId === proFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "activas"
            ? a.status === "en_sala" || a.status === "en_curso"
            : a.status === statusFilter;
      return matchPro && matchStatus;
    });
  }, [appointmentsList, proFilter, statusFilter]);

  const formatDateTitle = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatMonthYear = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    const m = dt.toLocaleDateString("es-BO", { month: "long" });
    const y = dt.getFullYear();
    return `${m.charAt(0).toUpperCase() + m.slice(1)} ${y}`;
  };

  // Carrusel semanal táctil
  const weekDays = useMemo(() => {
    const center = new Date(date + "T12:00:00");
    const days = [];
    for (let i = -3; i <= 3; i++) {
      const cur = new Date(center);
      cur.setDate(center.getDate() + i);
      const iso = cur.toISOString().slice(0, 10);
      days.push({
        iso,
        dayName: cur.toLocaleDateString("es-BO", { weekday: "narrow" }),
        dayNum: cur.getDate(),
        isCurrentDay: iso === date,
        isToday: iso === TODAY_DATE,
      });
    }
    return days;
  }, [date]);

  // Contadores para chips
  const totalCount = appointmentsList.length;
  const waitingOrChair = appointmentsList.filter(
    (a) => a.status === "en_sala" || a.status === "en_curso",
  ).length;
  const confirmedCount = appointmentsList.filter(
    (a) => a.status === "confirmada",
  ).length;
  const noShowCount = appointmentsList.filter(
    (a) => a.status === "no_asistio",
  ).length;

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 pb-24">
      {/* ── BARRA SUPERIOR: Selector de Calendario Minimalista (Floating Minimal) ── */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Fila Superior: Navegación de Mes/Año + Controles de Modo y Hoy (Sin botón +) */}
        <div className="flex items-center justify-between gap-2">
          {/* Mes actual con chevrons flotantes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeDate(addDays(date, -7))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95"
              aria-label="Semana anterior"
              title="Semana anterior"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <span className="capitalize font-display font-bold text-sm sm:text-base text-[var(--foreground)] tracking-tight px-1">
              {formatMonthYear(date)}
            </span>

            <button
              type="button"
              onClick={() => changeDate(addDays(date, 7))}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95"
              aria-label="Semana siguiente"
              title="Semana siguiente"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Acciones de la cabecera: Toggle de vista desktop + Botón Hoy + Botón Nueva Cita */}
          <div className="flex items-center gap-2">
            {/* Toggle Feed / Grid en desktop */}
            <div className="hidden sm:flex bg-[var(--background)] border border-[var(--border)] rounded-full p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("feed")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  viewMode === "feed"
                    ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Feed
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-xs font-semibold"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                Grilla
              </button>
            </div>

            <button
              type="button"
              onClick={() => changeDate(TODAY_DATE)}
              className={`px-3.5 h-8 text-xs font-semibold rounded-full border transition-all active:scale-95 shadow-2xs ${
                date === TODAY_DATE
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background)]"
              }`}
            >
              Hoy
            </button>



            <button
              type="button"
              onClick={() => setIsCreateApptOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-8 text-xs font-semibold rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 active:scale-95 shadow-xs transition-all"
            >
              <span className="text-sm font-bold leading-none">+</span>
              Nueva Cita
            </button>
          </div>
        </div>

        {/* Tira Semanal Flotante (Floating Minimal) */}
        <div className="grid grid-cols-7 gap-1 text-center items-center">
          {weekDays.map((wd) => (
            <button
              key={wd.iso}
              type="button"
              onClick={() => changeDate(wd.iso)}
              className="flex flex-col items-center gap-1.5 py-1.5 rounded-xl group transition-all"
            >
              <span
                className={`text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  wd.isCurrentDay
                    ? "text-[var(--primary)] font-bold"
                    : "text-[var(--muted)] group-hover:text-[var(--foreground)]"
                }`}
              >
                {wd.dayName}
              </span>
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all ${
                  wd.isCurrentDay
                    ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs scale-105"
                    : wd.isToday
                      ? "border border-[var(--primary)] text-[var(--primary)] font-semibold"
                      : "text-[var(--foreground)] group-hover:bg-[var(--background)]"
                }`}
              >
                {wd.dayNum}
              </span>
            </button>
          ))}
        </div>

        {/* Pie sutil del selector: Fecha completa y total de citas sin divisores pesados */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/50 text-xs">
          <span className="capitalize font-display font-medium text-xs sm:text-sm text-[var(--foreground)]">
            {formatDateTitle(date)}
          </span>
          <span className="text-[11px] font-mono text-[var(--muted)]">
            {totalCount} cita{totalCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* ── CHIPS DE FILTRO RÁPIDO ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
            statusFilter === "all"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-semibold shadow-xs"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] border-[var(--border)]"
          }`}
        >
          Todas ({totalCount})
        </button>

        {waitingOrChair > 0 && (
          <button
            onClick={() => setStatusFilter("activas")}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1.5 ${
              statusFilter === "activas"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-semibold shadow-xs"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] border-[var(--border)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>En clínica ({waitingOrChair})</span>
          </button>
        )}

        <button
          onClick={() => setStatusFilter("confirmada")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1.5 ${
            statusFilter === "confirmada"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-semibold shadow-xs"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] border-[var(--border)]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          <span>Confirmadas ({confirmedCount})</span>
        </button>

        <button
          onClick={() => setStatusFilter("programada")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
            statusFilter === "programada"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-semibold shadow-xs"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] border-[var(--border)]"
          }`}
        >
          Por confirmar
        </button>

        {noShowCount > 0 && (
          <button
            onClick={() => setStatusFilter("no_asistio")}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1.5 ${
              statusFilter === "no_asistio"
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] font-semibold shadow-xs"
                : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] border-[var(--border)]"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>No asistió ({noShowCount})</span>
          </button>
        )}
      </div>

      {/* ── CUERPO PRINCIPAL: FEED CRONOLÓGICO MÓVIL ── */}
      {loadError && <p role="alert" className="text-xs text-red-600">{loadError}</p>}
      {viewMode === "feed" ? (
        <div className="flex flex-col gap-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-[var(--muted)] animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
              Cargando agenda de citas...
            </div>
          ) : dayAppts.length === 0 ? (
            <div className="p-10 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center text-2xl">
                🦷
              </div>
              <div>
                <p className="font-display font-bold text-sm text-[var(--foreground)]">
                  No hay citas en este horario o filtro
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  El sillón está libre para nuevas reservas o urgencias
                </p>
              </div>
              <button
                onClick={() => setIsCreateApptOpen(true)}
                className="mt-2 h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold hover:bg-[var(--primary-accent)] active:scale-95 shadow-xs transition-all"
              >
                + Agendar Cita
              </button>
            </div>
          ) : (
            dayAppts.map((apt) => {
              const patient = getPatientById(apt.patientId);
              const svc = getServiceById(apt.serviceId);
              const pro = getProfessionalById(apt.professionalId);
              const cleanPhone = normalizePhoneNumber(
                patient?.phone || "",
                "591",
              );

              return (
                <div
                  key={apt.id}
                  className="group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[var(--primary)]/30 transition-all flex flex-col gap-3 relative"
                >
                  {patient?.allergies && patient.allergies.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-medium border border-rose-500/20 self-start">
                      <span className="w-3.5 h-3.5 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        {Icons.alertTriangle}
                      </span>
                      <span>Alergia: {patient.allergies.join(", ")}</span>
                    </span>
                  )}
                  {/* Encabezado de la tarjeta: Horario y Estado */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-base font-bold text-[var(--foreground)]">
                          {apt.startTime}
                        </span>
                        <span className="text-xs text-[var(--muted)] font-mono">
                          – {apt.endTime}
                        </span>
                      </div>
                      {svc?.durationMin && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-[var(--background)] text-[var(--muted)] border border-[var(--border)]/70">
                          {svc.durationMin} min
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-lg ${statusColors[apt.status]}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusDotColors[apt.status]}`}
                      />
                      <span>{statusLabels[apt.status]}</span>
                    </span>
                  </div>

                  {/* Detalle del paciente y servicio */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigate("cita-detalle", { citaId: apt.id })
                            }
                            className="text-left font-display text-base font-bold text-[var(--foreground)] hover:text-[var(--primary)] transition-colors truncate"
                          >
                            {patient?.name}
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[var(--muted)] flex-wrap">
                          <span className="font-medium text-[var(--foreground)]/80">
                            {svc?.name || "Servicio no especificado"}
                          </span>
                          {pro && (
                            <span className="inline-flex items-center gap-1.5 text-[var(--muted)]">
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: pro.color || "#3d7a46",
                                }}
                              />
                              <span>{pro.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {svc?.price !== undefined && (
                        <span className="font-mono text-xs font-semibold text-[var(--muted)] flex-shrink-0 pt-0.5">
                          {formatCurrency(svc.price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BARRA DE ACCIONES TÁCTILES RÁPIDAS (Jerárquica y armoniosa) */}
                  <div className="pt-3 border-t border-[var(--border)]/60 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    {/* Cluster de contacto secundario */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(apt)}
                        className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] hover:border-[var(--primary)]/30 text-[var(--foreground)] text-xs font-medium flex items-center gap-2 transition-all shadow-2xs active:scale-95"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {Icons.whatsappReal}
                        </span>
                        <span>WhatsApp</span>
                      </button>

                      {cleanPhone && (
                        <a
                          href={`tel:+${cleanPhone}`}
                          className="h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] flex items-center justify-center transition-all active:scale-95 shadow-2xs"
                          title={`Llamar a ${patient?.name || "paciente"}`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center">
                            {Icons.phoneCall}
                          </span>
                        </a>
                      )}
                    </div>

                    {/* Acciones contextuales de flujo de estado */}
                    <div className="ml-auto flex items-center gap-1.5">
                      {apt.status === "programada" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "confirmada")
                          }
                          className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-accent)] active:scale-95 text-[var(--primary-foreground)] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span className="w-3.5 h-3.5 flex items-center justify-center">
                            {Icons.check}
                          </span>
                          <span>Confirmar cita</span>
                        </button>
                      )}

                      {apt.status === "confirmada" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "en_sala")
                          }
                          className="h-9 px-4 bg-[var(--primary-subtle)] hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] active:scale-95 text-[var(--primary)] rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[var(--primary)]/20 shadow-2xs transition-all"
                        >
                          <span>A sala de espera</span>
                        </button>
                      )}

                      {apt.status === "en_sala" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "en_curso")
                          }
                          className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-accent)] active:scale-95 text-[var(--primary-foreground)] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>Pasar al sillón</span>
                        </button>
                      )}

                      {apt.status === "en_curso" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "completada")
                          }
                          className="h-9 px-4 bg-[var(--primary)] hover:bg-[var(--primary-accent)] active:scale-95 text-[var(--primary-foreground)] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span className="w-3.5 h-3.5 flex items-center justify-center">
                            {Icons.check}
                          </span>
                          <span>Finalizar y cobrar</span>
                        </button>
                      )}

                      {apt.status === "completada" && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate("cita-detalle", { citaId: apt.id })
                          }
                          className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--background)] text-[var(--foreground)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          <span>Ver Ficha</span>
                          <span className="w-3.5 h-3.5 flex items-center justify-center">
                            {Icons.chevronRight}
                          </span>
                        </button>
                      )}

                      {/* Marcar No Asistió si era programada o confirmada */}
                      {(apt.status === "programada" ||
                        apt.status === "confirmada") && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "no_asistio")
                          }
                          className="h-9 px-2.5 text-[var(--muted)] hover:text-rose-600 text-xs font-medium transition-colors rounded-xl"
                          title="Marcar que no asistió"
                        >
                          No asistió
                        </button>
                      )}

                      {/* Enlace rápido a detalle con chevron circular (excepto si ya se muestra Ver Ficha) */}
                      {apt.status !== "completada" && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate("cita-detalle", { citaId: apt.id })
                          }
                          className="h-9 w-9 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] flex items-center justify-center transition-all"
                          title="Ver detalle completo"
                        >
                          <span className="w-4 h-4 flex items-center justify-center">
                            {Icons.chevronRight}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── VISTA GRILLA HORARIA (Para Desktop / Tablet) ── */
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden p-4">
          <div className="flex gap-4 overflow-x-auto">
            <div className="flex flex-col" style={{ width: 64 }}>
              <div style={{ height: 36 }} />
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="flex items-start justify-end pr-3"
                  style={{ height: 80 }}
                >
                  <span className="text-[11px] font-mono text-[var(--muted)] -translate-y-2">
                    {h}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 min-w-[500px] border border-[var(--border)] rounded-xl relative overflow-hidden bg-[var(--background)]">
              {/* Horas */}
              {HOURS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-[var(--border)]"
                  style={{ top: i * 80 }}
                />
              ))}

              {/* Citas en grilla */}
              {dayAppts.map((apt) => {
                const start = timeToMinutes(apt.startTime) - 8 * 60;
                const duration = Math.max(
                  timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime),
                  30,
                );
                const top = (start / 60) * 80;
                const height = Math.max((duration / 60) * 80 - 4, 36);
                const patient = getPatientById(apt.patientId);
                const svc = getServiceById(apt.serviceId);

                return (
                  <div
                    key={apt.id}
                    onClick={() =>
                      onNavigate("cita-detalle", { citaId: apt.id })
                    }
                    style={{ top: `${top}px`, height: `${height}px` }}
                    className="absolute left-2 right-2 rounded-xl p-2.5 cursor-pointer border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]/60 shadow-2xs hover:shadow-xs flex items-center justify-between transition-all group overflow-hidden"
                  >
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        apt.status === "confirmada"
                          ? "bg-emerald-600 dark:bg-emerald-400"
                          : apt.status === "en_curso"
                            ? "bg-amber-600 dark:bg-amber-400"
                            : apt.status === "en_sala"
                              ? "bg-[var(--secondary)]"
                              : apt.status === "no_asistio"
                                ? "bg-orange-500"
                                : apt.status === "cancelada"
                                  ? "bg-rose-500"
                                  : "bg-stone-300 dark:bg-stone-600"
                      }`}
                    />
                    <div className="min-w-0 pl-1.5">
                      <p className="text-xs font-display font-bold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                        {patient?.name}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] truncate">
                        {svc?.name} · {apt.startTime} - {apt.endTime}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ml-2 flex-shrink-0 ${statusColors[apt.status]}`}
                    >
                      {statusLabels[apt.status]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── BOTÓN FLOTANTE MÓVIL (FAB) ── */}
      <button
        onClick={() => setIsCreateApptOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 w-14 h-14 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] shadow-xl flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform z-30"
        aria-label="Nueva cita rápida"
      >
        +
      </button>

      {/* ── MODAL WHATSAPP ── */}
      <WhatsAppModal
        isOpen={isWaOpen}
        onClose={() => setIsWaOpen(false)}
        context={waContext}
        defaultTemplate={waTemplate}
      />

      {/* ── PROMPT DE COBRO AUTOMÁTICO ── */}
      {paymentPromptAppointment && (
        <PaymentPromptModal
          isOpen={!!paymentPromptAppointment}
          onClose={() => setPaymentPromptAppointment(null)}
          onConfirmPayment={() => {
            const pid = paymentPromptAppointment.patientId;
            const sid = paymentPromptAppointment.serviceId;
            const svcPrice = getServiceById(sid)?.price || 0;
            const svcName = getServiceById(sid)?.name || "Atención Odontológica";
            setPaymentPromptAppointment(null);
            setPaymentModalState({
              open: true,
              patientId: pid,
              amount: svcPrice,
              serviceId: sid,
              concept: `Cobro por ${svcName}`,
            });
          }}
          patientName={
            getPatientById(paymentPromptAppointment.patientId)?.name ||
            "Paciente"
          }
          serviceName={
            getServiceById(paymentPromptAppointment.serviceId)?.name ||
            "Atención Odontológica"
          }
          priceFormatted={formatCurrency(
            getServiceById(paymentPromptAppointment.serviceId)?.price || 0,
          )}
        />
      )}

      {/* ── MODAL AGENDAR CITA ── */}
      <CreateAppointmentModal
        open={isCreateApptOpen}
        initialDate={date}
        onClose={() => setIsCreateApptOpen(false)}
        onSuccess={(newAppt) => {
          if (newAppt.date === date) {
            setAppointmentsList((prev) => [newAppt, ...prev]);
          }
        }}
      />

      {/* ── MODAL REGISTRAR PAGO ── */}
      <RegisterPaymentModal
        open={paymentModalState.open}
        initialPatientId={paymentModalState.patientId}
        initialAmount={paymentModalState.amount}
        initialServiceId={paymentModalState.serviceId}
        initialConcept={paymentModalState.concept}
        onClose={() => setPaymentModalState({ open: false })}
        onSuccess={() => {
          setPaymentModalState({ open: false });
        }}
      />
    </div>
  );
}
