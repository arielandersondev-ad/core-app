"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getPatientById,
  getServiceById,
  getProfessionalById,
  getAppointmentsByDate,
  statusColors,
  statusLabels,
  professionals,
  TODAY_DATE,
  Appointment,
  AppointmentStatus,
  formatCurrency,
} from "@/shared/data/clinic-data";
import {
  fetchAppointments,
  updateAppointmentStatus,
  AppointmentDto,
} from "@/modules/clinic/api/appointments";
import { env } from "@/infrastructure/config/env";
import { Icons } from "@/shared/components/ui/Icons";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
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

const statusBorderAccents: Record<AppointmentStatus, string> = {
  programada: "border-l-blue-400",
  confirmada: "border-l-emerald-500",
  en_sala: "border-l-purple-500",
  en_curso: "border-l-amber-500",
  completada: "border-l-zinc-300 dark:border-l-zinc-700",
  no_asistio: "border-l-orange-400",
  cancelada: "border-l-rose-400",
};

const statusDotColors: Record<AppointmentStatus, string> = {
  programada: "bg-blue-500",
  confirmada: "bg-emerald-500",
  en_sala: "bg-purple-500 animate-pulse",
  en_curso: "bg-amber-500 animate-pulse",
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

  return {
    id: dto.id,
    patientId: dto.patientId,
    professionalId: dto.professionalMembershipId,
    serviceId: dto.serviceId,
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
  const [proFilter, setProFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromApi, setIsFromApi] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetchAppointments({
      organizationId: env.organizationId,
      date,
    })
      .then((dtos) => {
        if (isMounted) {
          if (dtos && dtos.length > 0) {
            setAppointmentsList(dtos.map(mapDtoToAppointment));
            setIsFromApi(true);
          } else {
            const fallback = getAppointmentsByDate(date);
            setAppointmentsList(fallback);
            setIsFromApi(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAppointmentsList(getAppointmentsByDate(date));
          setIsFromApi(false);
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
    newStatus: AppointmentStatus,
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
    } catch (_err) {
      // Mantenemos la actualización local en caso de estar en modo mock
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
    <div className="flex flex-col gap-4 p-3 sm:p-6 max-w-5xl mx-auto pb-24">
      {/* ── BARRA SUPERIOR: Selector de Calendario Minimalista (Floating Minimal) ── */}
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
        {/* Fila Superior: Navegación de Mes/Año + Controles de Modo y Hoy (Sin botón +) */}
        <div className="flex items-center justify-between gap-2">
          {/* Mes actual con chevrons flotantes */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDate((d) => addDays(d, -7))}
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
              onClick={() => setDate((d) => addDays(d, 7))}
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

          {/* Acciones de la cabecera: Toggle de vista desktop + Botón Hoy */}
          <div className="flex items-center gap-1.5">
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
              onClick={() => setDate(TODAY_DATE)}
              className={`px-3.5 h-8 text-xs font-semibold rounded-full border transition-all active:scale-95 shadow-2xs ${
                date === TODAY_DATE
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background)]"
              }`}
            >
              Hoy
            </button>

            {isFromApi && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-medium border border-emerald-200/70">
                API
              </span>
            )}
          </div>
        </div>

        {/* Tira Semanal Flotante (Floating Minimal) */}
        <div className="grid grid-cols-7 gap-1 text-center items-center">
          {weekDays.map((wd) => (
            <button
              key={wd.iso}
              type="button"
              onClick={() => setDate(wd.iso)}
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
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
            statusFilter === "all"
              ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] font-semibold"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
          }`}
        >
          Todas ({totalCount})
        </button>

        {waitingOrChair > 0 && (
          <button
            onClick={() => setStatusFilter("activas")}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border flex items-center gap-1.5 ${
              statusFilter === "activas"
                ? "bg-purple-600 text-white border-purple-600 font-semibold"
                : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span>En clínica ({waitingOrChair})</span>
          </button>
        )}

        <button
          onClick={() => setStatusFilter("confirmada")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
            statusFilter === "confirmada"
              ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
          }`}
        >
          Confirmadas ({confirmedCount})
        </button>

        <button
          onClick={() => setStatusFilter("programada")}
          className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
            statusFilter === "programada"
              ? "bg-blue-600 text-white border-blue-600 font-semibold"
              : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border-[var(--border)]"
          }`}
        >
          Por confirmar
        </button>

        {noShowCount > 0 && (
          <button
            onClick={() => setStatusFilter("no_asistio")}
            className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium transition-all border ${
              statusFilter === "no_asistio"
                ? "bg-orange-600 text-white border-orange-600 font-semibold"
                : "bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800"
            }`}
          >
            No asistió ({noShowCount})
          </button>
        )}
      </div>

      {/* ── CUERPO PRINCIPAL: FEED CRONOLÓGICO MÓVIL ── */}
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
                onClick={() => onNavigate("nueva-cita")}
                className="mt-2 h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-xl text-xs font-semibold"
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
                  className={`group bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl py-2 px-3 shadow-2xs hover:shadow-xs transition-all flex flex-col gap-3 border-l-4 ${statusBorderAccents[apt.status]} hover:border-[var(--foreground)]/20`}
                >
                  {patient?.allergies && patient.allergies.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-semibold border border-rose-200/80 dark:border-rose-900/60">
                      <span className="w-3 h-3 flex items-center justify-center text-rose-600 dark:text-rose-400">
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
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-xl bg-[var(--background)] text-[var(--muted)] border border-[var(--border)]/70">
                          {svc.durationMin} min
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-medium rounded-xl border ${statusColors[apt.status]}`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-xl ${statusDotColors[apt.status]}`}
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
                                className="w-1.5 h-1.5 rounded-xl"
                                style={{
                                  backgroundColor: pro.color || "#10b981",
                                }}
                              />
                              <span>{pro.name}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {svc?.basePriceMinor !== undefined && (
                        <span className="font-mono text-xs font-semibold text-[var(--muted)] flex-shrink-0 pt-0.5">
                          {formatCurrency(svc.basePriceMinor)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* BARRA DE ACCIONES TÁCTILES RÁPIDAS (Thumb-friendly & Jerárquica) */}
                  <div className="pt-2.5 border-t border-[var(--border)]/70 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    {/* Cluster de contacto secundario */}
                    <div className="flex items-center gap-1.5">
                      {/* Botón WhatsApp con icono oficial real */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsApp(apt)}
                        className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-800 text-[var(--foreground)] hover:text-emerald-700 dark:hover:text-emerald-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-2xs active:scale-95"
                        title="Enviar mensaje por WhatsApp"
                      >
                        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                          {Icons.whatsappReal}
                        </span>
                        <span>WhatsApp</span>
                      </button>

                      {/* Botón de llamada directa circular */}
                      {cleanPhone && (
                        <a
                          href={`tel:+${cleanPhone}`}
                          className="h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] flex items-center justify-center transition-all active:scale-95 shadow-2xs"
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
                          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span className="w-3.5 h-3.5 flex items-center justify-center">
                            {Icons.check}
                          </span>
                          <span>Confirmar</span>
                        </button>
                      )}

                      {apt.status === "confirmada" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "en_sala")
                          }
                          className="h-9 px-4 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>🚪 Ingresar a Sala</span>
                        </button>
                      )}

                      {apt.status === "en_sala" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "en_curso")
                          }
                          className="h-9 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span>🦷 Pasar al Sillón</span>
                        </button>
                      )}

                      {apt.status === "en_curso" && (
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickStatusChange(apt.id, "completada")
                          }
                          className="h-9 px-4 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-[var(--primary-foreground)] rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                        >
                          <span className="w-3.5 h-3.5 flex items-center justify-center">
                            {Icons.check}
                          </span>
                          <span>Finalizar (Cobrar)</span>
                        </button>
                      )}

                      {apt.status === "completada" && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate("cita-detalle", { citaId: apt.id })
                          }
                          className="h-9 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--background)] text-[var(--foreground)] text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
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
                          className="h-9 px-2.5 text-[var(--muted)] hover:text-amber-700 dark:hover:text-amber-400 text-xs font-medium transition-colors rounded-xl"
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
                    className={`absolute left-2 right-2 rounded-xl p-2 cursor-pointer border shadow-xs flex items-center justify-between transition-transform hover:scale-[1.01] ${statusColors[apt.status]}`}
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">
                        {patient?.name}
                      </p>
                      <p className="text-[10px] truncate">
                        {svc?.name} · {apt.startTime} - {apt.endTime}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase ml-2">
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
        onClick={() => onNavigate("nueva-cita")}
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
            setPaymentPromptAppointment(null);
            onNavigate("registrar-pago", { patientId: pid });
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
            getServiceById(paymentPromptAppointment.serviceId)?.basePriceMinor || 0,
          )}
        />
      )}
    </div>
  );
}
