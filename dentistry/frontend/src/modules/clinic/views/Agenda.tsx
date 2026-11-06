"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import {
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
import {
  EmptyState,
  Button,
  MobileFloatingActionMenu,
  PullToRefresh,
} from "@/shared/components/ui";
import { WhatsAppModal } from "@/shared/components/ui/WhatsAppModal";
import { PaymentPromptModal } from "@/shared/components/ui/PaymentPromptModal";
import {
  CreateAppointmentModal,
  CreatePatientModal,
  RegisterPaymentModal,
  AppointmentDetailSheet,
} from "@/modules/clinic/components";
import {
  DentalWhatsAppContext,
  WhatsAppTemplateKey,
  normalizePhoneNumber,
} from "@/shared/utils/whatsapp-generator";
import { DEV_PERSONAS } from "@/features/dev-auth/types/personas";

const formatLocalPhone = (phone?: string | null): string => {
  if (!phone || phone === "-") return "";
  return phone.replace(/^\+?(?:591)?[\s-]*/, "").trim();
};

function getDoctorDisplay(professionalId?: string) {
  if (!professionalId) return null;
  const pro = getProfessionalById(professionalId);
  if (pro) return { name: pro.name, color: pro.color || "#3d7a46" };
  if (professionalId === DEV_PERSONAS.practitioner.membershipId) {
    return { name: DEV_PERSONAS.practitioner.name, color: "#3d7a46" };
  }
  if (professionalId === DEV_PERSONAS.owner.membershipId) {
    return { name: DEV_PERSONAS.owner.name, color: "#6366f1" };
  }
  return { name: "Odontólogo asignado", color: "#3d7a46" };
}

function isPersonaAppointment(apt: Appointment): boolean {
  if (apt.patientType === "person") return true;
  if (apt.patientType === "patient") return false;
  if (apt.personName && !apt.patientName) return true;
  if (
    apt.notes &&
    (apt.notes.toLowerCase().includes("registro rápido de persona") ||
      apt.notes.toLowerCase().includes("registro rápido"))
  )
    return true;
  return false;
}

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
  CANCELED: "cancelada",
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

function getTimelineDotColor(status: AppointmentStatus): string {
  switch (status) {
    case "confirmada":
    case "completada":
      return "bg-emerald-500";
    case "no_asistio":
    case "cancelada":
      return "bg-rose-500";
    case "programada":
    case "en_sala":
    case "en_curso":
    default:
      return "bg-amber-400";
  }
}

export function isAppointmentOverdue(
  apt: Appointment,
  nowDateStr: string,
  nowMinutes: number,
): boolean {
  if (apt.status === "no_asistio") return true;
  if (apt.status !== "programada" && apt.status !== "confirmada") return false;
  if (apt.date < nowDateStr) return true;
  if (apt.date > nowDateStr) return false;

  const endMin = apt.endTime ? timeToMinutes(apt.endTime) : 0;
  const startMin = apt.startTime ? timeToMinutes(apt.startTime) : 0;
  const threshold = endMin > startMin ? endMin : startMin;
  return threshold <= nowMinutes;
}

function mapDtoToAppointment(dto: AppointmentDto): Appointment {
  const startDate = new Date(dto.scheduledStartAt);
  const endDate = new Date(dto.scheduledEndAt);
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
        : dto.serviceId
          ? [dto.serviceId]
          : [];

  const serviceName =
    dto.serviceName ||
    (dto.services && dto.services[0]?.serviceName) ||
    undefined;

  return {
    id: dto.id,
    patientId: dto.patientId,
    patientName: dto.patientName,
    personName: dto.personName,
    patientPhone: dto.patientPhone || dto.personPhone,
    personPhone: dto.personPhone,
    serviceName,
    professionalId: dto.practitionerMembershipId || "",
    serviceId: dto.serviceId || serviceIds[0] || "",
    serviceIds,
    date: dto.scheduledStartAt.slice(0, 10),
    startTime,
    endTime,
    status: statusMap[dto.status] ?? "programada",
    notes: dto.notes ?? "",
    reason: dto.reason ?? undefined,
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
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [selectedDetailCitaId, setSelectedDetailCitaId] = useState<
    string | null
  >(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
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

  const handleRefreshAppointments = async () => {
    try {
      const dtos = await fetchAppointments({ date });
      setAppointmentsList(dtos.map(mapDtoToAppointment));
      setLoadError(null);
    } catch {
      setLoadError("No se pudo actualizar la agenda.");
    }
  };

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
        prev.map((item) => (item.id === aptId ? apt : item)),
      );
    }

    // Si la cita pasó a completada, abrir prompt de cobro automático
    if (newStatus === "completada") {
      setPaymentPromptAppointment({ ...apt, status: "completada" });
    }
  };

  const handleOpenWhatsApp = (apt: Appointment) => {
    const svc = getServiceById(apt.serviceId);
    const pro = getProfessionalById(apt.professionalId);

    const patientName =
      apt.patientName || apt.personName || "Paciente sin nombre";
    const patientPhone = apt.patientPhone || apt.personPhone || "";
    const serviceName = apt.serviceName || svc?.name || "Consulta odontológica";

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
      patientName,
      patientPhone,
      serviceName,
      dateStr: dateFormatted,
      timeStr: apt.startTime,
      clinicName: "Dental Care Consultorio",
      professionalName: pro?.name,
    });
    setWaTemplate(defaultTpl);
    setIsWaOpen(true);
  };

  const now = new Date();
  const nowDateStr = now.toISOString().slice(0, 10);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const dayAppts = useMemo(() => {
    const filtered = appointmentsList.filter((a) => {
      const matchPro = proFilter === "all" || a.professionalId === proFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "activas"
            ? a.status === "en_sala" || a.status === "en_curso"
            : a.status === statusFilter;
      return matchPro && matchStatus;
    });

    const upcoming: Appointment[] = [];
    const overdue: Appointment[] = [];

    for (const apt of filtered) {
      if (isAppointmentOverdue(apt, nowDateStr, nowMinutes)) {
        overdue.push(apt);
      } else {
        upcoming.push(apt);
      }
    }

    const sortByTime = (a: Appointment, b: Appointment) =>
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime);

    upcoming.sort(sortByTime);
    overdue.sort(sortByTime);

    return [...upcoming, ...overdue];
  }, [appointmentsList, proFilter, statusFilter, nowDateStr, nowMinutes]);

  // Estado de expansión de tarjeta en Feed (por defecto la primera cita de dayAppts)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (dayAppts.length > 0) {
      setExpandedId((prev) => {
        if (prev && dayAppts.some((a) => a.id === prev)) return prev;
        return dayAppts[0].id;
      });
    } else {
      setExpandedId(null);
    }
  }, [date, statusFilter, appointmentsList]);

  const handleToggleExpand = (aptId: string) => {
    setExpandedId((prev) => (prev === aptId ? null : aptId));
  };

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
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4 pb-24 h-full">
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
      <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar text-xs py-2">
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
      {loadError && (
        <p role="alert" className="text-xs text-red-600">
          {loadError}
        </p>
      )}
      {viewMode === "feed" ? (
        <PullToRefresh onRefresh={handleRefreshAppointments}>
          <div className="flex flex-col gap-3 h-full">
            {isLoading ? (
              <div className="p-8 text-center text-xs font-mono text-[var(--muted)] animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
                Cargando agenda de citas...
              </div>
            ) : dayAppts.length === 0 ? (
              <EmptyState
                icon={<span className="text-2xl">🦷</span>}
                message="No hay citas en este horario o filtro"
                description="El sillón está libre para nuevas reservas o urgencias"
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsCreateApptOpen(true)}
                    className="rounded-xl shadow-xs"
                  >
                    + Agendar Cita
                  </Button>
                }
                className="w-full justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-10"
              />
            ) : (
              dayAppts.map((apt, index) => {
                const isOverdue = isAppointmentOverdue(
                  apt,
                  nowDateStr,
                  nowMinutes,
                );
                const showOverdueDivider =
                  isOverdue &&
                  index > 0 &&
                  !isAppointmentOverdue(
                    dayAppts[index - 1],
                    nowDateStr,
                    nowMinutes,
                  );
                const svc = getServiceById(apt.serviceId);
                const doctor = getDoctorDisplay(apt.professionalId);
                const isPerson = isPersonaAppointment(apt);
                const rawPhone = apt.patientPhone || apt.personPhone || "";
                const cleanPhone = normalizePhoneNumber(rawPhone, "591");
                const displayPhone = formatLocalPhone(rawPhone);
                const patientName =
                  apt.patientName || apt.personName || "Paciente sin nombre";
                const svcName =
                  apt.serviceName ||
                  svc?.name ||
                  "Consulta / Evaluación general";
                const noteContent = (apt.reason || apt.notes || "").trim();
                const cleanedNote = noteContent
                  .replace(/^Registro rápido de persona en cita:\s*/i, "")
                  .trim();

                const diffMin =
                  timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime);
                const durationMin =
                  diffMin > 0 ? diffMin : svc?.durationMin || 30;
                const isExpanded = expandedId === apt.id;

                return (
                  <Fragment key={apt.id}>
                    {showOverdueDivider && (
                      <div
                        className="flex items-center gap-3 pt-2 pb-1 px-1"
                        data-testid="overdue-appointments-divider"
                      >
                        <div className="h-px flex-1 bg-rose-500/20" />
                        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500/80 dark:text-rose-400/80 font-semibold">
                          ⏰ Citas vencidas (hora pasada)
                        </span>
                        <div className="h-px flex-1 bg-rose-500/20" />
                      </div>
                    )}
                    <div className="flex gap-3 sm:gap-4 items-stretch">
                      {/* 1) Columna Izquierda — Riel de Timeline */}
                      <div className="w-12 sm:w-14 flex flex-col items-center pt-3.5 shrink-0">
                        <span
                          className={`font-mono text-xs sm:text-sm font-bold ${
                            isOverdue
                              ? "text-rose-500/80 dark:text-rose-400/80 line-through decoration-rose-500/50"
                              : "text-[var(--foreground)]"
                          }`}
                        >
                          {apt.startTime}
                        </span>
                        <span
                          className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${
                            isOverdue
                              ? "bg-rose-500 ring-3 ring-rose-500/20"
                              : getTimelineDotColor(apt.status)
                          }`}
                        />
                        <span
                          className={
                            isOverdue
                              ? "w-px flex-1 border-l border-dashed border-rose-500/30 my-1.5"
                              : "w-px flex-1 bg-[var(--border)] my-1.5"
                          }
                        />
                      </div>

                      {/* 2) Columna Derecha — Tarjeta Desplegable / Acordeón */}
                      <div
                        className={`flex-1 min-w-0 rounded-2xl p-4 transition-all shadow-2xs ${
                          isOverdue
                            ? "border border-dashed border-rose-500/35 dark:border-rose-400/30 bg-rose-500/[0.03] dark:bg-rose-950/10 opacity-75 hover:opacity-100"
                            : "border border-[var(--border)] bg-[var(--surface-elevated)]"
                        }`}
                      >
                        {/* Cabecera de la tarjeta */}
                        <div
                          className="flex items-center justify-between gap-2 cursor-pointer select-none"
                          onClick={() => handleToggleExpand(apt.id)}
                        >
                          <div className="flex items-center gap-2 min-w-0 truncate">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailCitaId(apt.id);
                                setIsDetailSheetOpen(true);
                              }}
                              className="text-left font-display text-base font-bold text-[var(--foreground)] underline decoration-dotted decoration-[var(--muted)]/70 underline-offset-4 hover:decoration-[var(--primary)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer"
                            >
                              {patientName}
                            </button>
                            {isOverdue && (
                              <span
                                data-testid="appointment-overdue-badge"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0"
                              >
                                ⏰ Vencida
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            aria-label={
                              isExpanded ? "Colapsar cita" : "Expandir cita"
                            }
                            className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-lg shrink-0 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleExpand(apt.id);
                            }}
                          >
                            {isExpanded ? (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="18 15 12 9 6 15" />
                              </svg>
                            ) : (
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Vista Colapsada */}
                        {!isExpanded && (
                          <div
                            className="mt-1 cursor-pointer"
                            onClick={() => handleToggleExpand(apt.id)}
                          >
                            <p className="text-sm text-[var(--muted)] truncate">
                              {svcName} · {durationMin} min
                            </p>
                            {cleanedNote && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400/90 truncate">
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="shrink-0"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span className="truncate">{cleanedNote}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vista Expandida */}
                        {isExpanded && (
                          <div className="mt-1">
                            {displayPhone && (
                              <p className="text-[11px] font-mono text-[var(--muted)]/75 leading-tight mt-0.5 mb-1">
                                {displayPhone}
                              </p>
                            )}
                            <p className="text-sm text-[var(--muted)]">
                              {svcName}
                            </p>
                            {cleanedNote && (
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400/90">
                                <svg
                                  width="13"
                                  height="13"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="shrink-0"
                                >
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                  <polyline points="14 2 14 8 20 8" />
                                  <line x1="16" y1="13" x2="8" y2="13" />
                                  <line x1="16" y1="17" x2="8" y2="17" />
                                  <polyline points="10 9 9 9 8 9" />
                                </svg>
                                <span>{cleanedNote}</span>
                              </div>
                            )}

                            {/* Fila de Acciones Táctiles */}
                            <div className="mt-3.5 flex items-center gap-2">
                              {/* WhatsApp */}
                              <button
                                type="button"
                                onClick={() => handleOpenWhatsApp(apt)}
                                className="h-10 w-12 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-emerald-500/40 flex items-center justify-center shrink-0 transition-colors cursor-pointer active:scale-95 shadow-2xs"
                                title="Enviar WhatsApp"
                              >
                                <span className="w-5 h-5 flex items-center justify-center">
                                  {Icons.whatsappReal}
                                </span>
                              </button>

                              {/* Teléfono */}
                              {cleanPhone || displayPhone ? (
                                <a
                                  href={`tel:+${cleanPhone || displayPhone}`}
                                  className="h-10 w-12 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-[var(--foreground)]/40 flex items-center justify-center shrink-0 text-[var(--foreground)] transition-colors active:scale-95 shadow-2xs"
                                  title={`Llamar a ${displayPhone || patientName}`}
                                >
                                  <span className="w-4 h-4 flex items-center justify-center">
                                    {Icons.phoneCall}
                                  </span>
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="h-10 w-12 rounded-xl border border-[var(--border)] bg-[var(--background)] opacity-40 flex items-center justify-center shrink-0 text-[var(--muted)]"
                                >
                                  <span className="w-4 h-4 flex items-center justify-center">
                                    {Icons.phoneCall}
                                  </span>
                                </button>
                              )}

                              {/* Botón Primario Ancho Verde o Estado Informativo */}
                              {[
                                "programada",
                                "confirmada",
                                "en_sala",
                                "en_curso",
                              ].includes(apt.status) ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (apt.status === "programada") {
                                      handleQuickStatusChange(
                                        apt.id,
                                        "confirmada",
                                      );
                                    } else if (apt.status === "confirmada") {
                                      handleQuickStatusChange(
                                        apt.id,
                                        "en_sala",
                                      );
                                    } else if (apt.status === "en_sala") {
                                      handleQuickStatusChange(
                                        apt.id,
                                        "en_curso",
                                      );
                                    } else if (apt.status === "en_curso") {
                                      handleQuickStatusChange(
                                        apt.id,
                                        "completada",
                                      );
                                    }
                                  }}
                                  className="flex-1 h-10 rounded-xl bg-[#6cc24a] hover:bg-[#5db33c] text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-[0.99] shadow-xs"
                                >
                                  {apt.status === "programada" && (
                                    <>
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                      <span>Confirmar</span>
                                    </>
                                  )}
                                  {apt.status === "confirmada" && (
                                    <>
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                      <span>A sala de espera</span>
                                    </>
                                  )}
                                  {apt.status === "en_sala" && (
                                    <>
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                      <span>Pasar al sillón</span>
                                    </>
                                  )}
                                  {apt.status === "en_curso" && (
                                    <>
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                      <span>Finalizar</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex-1 h-10 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] font-medium text-xs flex items-center justify-center gap-1.5 select-none">
                                  <span>
                                    {statusLabels[apt.status] || apt.status}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Fila Inferior del Acordeón */}
                            <div className="mt-3 pt-1 flex items-center justify-between text-xs text-[var(--muted)]">
                              <div className="flex items-center gap-3">
                                {apt.status !== "no_asistio" &&
                                  apt.status !== "cancelada" &&
                                  apt.status !== "completada" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQuickStatusChange(
                                          apt.id,
                                          "no_asistio",
                                        )
                                      }
                                      className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer transition-colors"
                                      title="Marcar que no asistió"
                                    >
                                      <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="8.5" cy="7" r="4" />
                                        <line x1="18" y1="8" x2="23" y2="13" />
                                        <line x1="23" y1="8" x2="18" y2="13" />
                                      </svg>
                                      <span>No asistió</span>
                                    </button>
                                  )}
                              </div>
                              <span className="font-mono text-xs text-[var(--muted)]">
                                {durationMin} min
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Fragment>
                );
              })
            )}
          </div>
        </PullToRefresh>
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
                const svc = getServiceById(apt.serviceId);
                const doctor = getDoctorDisplay(apt.professionalId);
                const isPerson = isPersonaAppointment(apt);
                const rawPhone = apt.patientPhone || apt.personPhone || "";
                const displayPhone = formatLocalPhone(rawPhone);
                const patientName =
                  apt.patientName || apt.personName || "Paciente sin nombre";
                const svcName =
                  apt.serviceName ||
                  svc?.name ||
                  "Consulta / Evaluación general";
                const noteContent = (apt.reason || apt.notes || "").trim();
                const cleanedNote = noteContent
                  .replace(/^Registro rápido de persona en cita:\s*/i, "")
                  .trim();

                return (
                  <div
                    key={apt.id}
                    onClick={() => {
                      setSelectedDetailCitaId(apt.id);
                      setIsDetailSheetOpen(true);
                    }}
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
                    <div className="min-w-0 pl-1.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-display font-bold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                          {patientName}
                        </p>
                        {isPerson ? (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-medium px-1.5 py-0.2 rounded">
                            Persona
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-medium px-1.5 py-0.2 rounded">
                            Paciente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] truncate">
                        <span className="truncate">{svcName}</span>
                        <span>·</span>
                        {doctor ? (
                          <span className="truncate">{doctor.name}</span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                            Por asignar
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-mono">
                          {apt.startTime} - {apt.endTime}
                        </span>
                        {displayPhone && (
                          <>
                            <span>·</span>
                            <span className="font-mono">📞 {displayPhone}</span>
                          </>
                        )}
                      </div>
                      {cleanedNote && (
                        <p className="text-[10px] text-[var(--muted)] truncate max-w-md flex items-center gap-1">
                          <span className="opacity-70 shrink-0">📝</span>
                          <span className="truncate">{cleanedNote}</span>
                        </p>
                      )}
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

      {/* ── MENÚ FLOTANTE DE ACCIONES RÁPIDAS MÓVIL (Speed-Dial FAB) ── */}
      <MobileFloatingActionMenu
        ariaLabel="Acciones rápidas de agenda"
        className="md:hidden"
        actions={[
          {
            label: "Nueva Cita",
            icon: Icons.calendar,
            variant: "primary",
            onClick: () => setIsCreateApptOpen(true),
          },
          {
            label: "Nuevo Paciente",
            icon: Icons.users,
            onClick: () => setIsCreatePatientOpen(true),
          },
          {
            label: "Cobro Rápido",
            icon: Icons.dollarSign,
            onClick: () => setPaymentModalState({ open: true }),
          },
        ]}
      />

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
            const svcName =
              getServiceById(sid)?.name || "Atención Odontológica";
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
            paymentPromptAppointment.patientName ||
            paymentPromptAppointment.personName ||
            "Paciente sin nombre"
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

      {/* ── MODAL NUEVO PACIENTE ── */}
      <CreatePatientModal
        open={isCreatePatientOpen}
        onClose={() => setIsCreatePatientOpen(false)}
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

      {/* ── BOTTOMSHEET DETALLE DE CITA (READ-ONLY + KEBAB MENU) ── */}
      <AppointmentDetailSheet
        open={isDetailSheetOpen}
        citaId={selectedDetailCitaId}
        initialAppointment={appointmentsList.find(
          (a) => a.id === selectedDetailCitaId,
        )}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedDetailCitaId(null);
        }}
        onStatusUpdated={(id, newStatus) => {
          setAppointmentsList((prev) =>
            prev.map((a) =>
              a.id === id
                ? { ...a, status: statusMap[newStatus] ?? "programada" }
                : a,
            ),
          );
        }}
        onOpenPayment={(id, patientId, amount) => {
          setIsDetailSheetOpen(false);
          setPaymentModalState({
            open: true,
            patientId,
            amount,
          });
        }}
        onOpenWhatsApp={(
          patientName,
          patientPhone,
          serviceName,
          dateStr,
          timeStr,
        ) => {
          setIsDetailSheetOpen(false);
          setWaContext({
            patientName,
            patientPhone,
            serviceName,
            dateStr,
            timeStr,
            clinicName: "Dental Care Consultorio",
          });
          setWaTemplate("confirmacion");
          setIsWaOpen(true);
        }}
      />
    </div>
  );
}
