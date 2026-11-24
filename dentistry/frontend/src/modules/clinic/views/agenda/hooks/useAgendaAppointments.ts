"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Appointment,
  AppointmentStatus,
  getProfessionalById,
} from "@/modules/clinic/__mocks__/data";
import {
  type AppointmentDto,
} from "@/modules/clinic/api/appointments";
import {
  useAppointments,
  useUpdateAppointmentStatus,
  useCancelAppointment,
} from "@/modules/clinic/hooks";
import { DEV_PERSONAS } from "@/features/dev-auth/types/personas";
import type { AppointmentProcedureTarget } from "@/features/clinical-encounter/components/appointment-procedure-flow";
import { useTimeZone, useTimeZoneResolver } from "@/shared/time/use-time-zone";
import { civilDateIn, minutesOfDayIn, timeIn, todayIn } from "@/shared/time/zoned-time";
import { addDaysIso, countActiveByDate, weekStartOf } from "../week";

export const formatLocalPhone = (phone?: string | null): string => {
  if (!phone || phone === "-") return "";
  return phone.replace(/^\+?(?:591)?[\s-]*/, "").trim();
};

export function getDoctorDisplay(professionalId?: string) {
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

export function isPersonaAppointment(apt: Appointment): boolean {
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

export function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const HOURS = Array.from(
  { length: 12 },
  (_, i) => `${String(i + 8).padStart(2, "0")}:00`,
);

export function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export const statusMap: Record<string, AppointmentStatus> = {
  SCHEDULED: "programada",
  CONFIRMED: "confirmada",
  WAITING_ROOM: "en_sala",
  IN_PROGRESS: "en_curso",
  COMPLETED: "completada",
  NO_SHOW: "no_asistio",
  CANCELED: "cancelada",
};

export type QuickStatus = Exclude<AppointmentStatus, "cancelada">;

export const backendStatusMap: Record<
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

export const statusDotColors: Record<AppointmentStatus, string> = {
  programada: "bg-stone-400 dark:bg-stone-500",
  confirmada: "bg-emerald-600 dark:bg-emerald-400",
  en_sala: "bg-[var(--secondary)]",
  en_curso: "bg-amber-600 dark:bg-amber-400",
  completada: "bg-zinc-400",
  no_asistio: "bg-orange-500",
  cancelada: "bg-rose-500",
};

export function getTimelineDotColor(status: AppointmentStatus): string {
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
  /** Con la zona de la cita, "ahora" se mide en la hora de su sucursal. */
  now?: Date,
): boolean {
  if (now && apt.timeZone) {
    nowDateStr = todayIn(apt.timeZone, now);
    nowMinutes = minutesOfDayIn(now, apt.timeZone);
  }
  if (apt.status === "no_asistio") return true;
  if (apt.status !== "programada" && apt.status !== "confirmada") return false;
  if (apt.date < nowDateStr) return true;
  if (apt.date > nowDateStr) return false;

  const endMin = apt.endTime ? timeToMinutes(apt.endTime) : 0;
  const startMin = apt.startTime ? timeToMinutes(apt.startTime) : 0;
  const threshold = endMin > startMin ? endMin : startMin;
  return threshold <= nowMinutes;
}

/** Cita de la agenda → atención rápida; sin sucursal conocida no se puede registrar. */
export function toProcedureTarget(apt: Appointment): AppointmentProcedureTarget | null {
  if (!apt.branchId || !apt.patientId) return null;
  const patientName = apt.patientName || apt.personName;
  return {
    patientId: apt.patientId,
    appointmentId: apt.id,
    branchId: apt.branchId,
    patientName,
    label: [patientName, `${apt.startTime} – ${apt.endTime}`].filter(Boolean).join(" · "),
  };
}

/** DTO → modelo de la agenda; fecha y horas en la zona de la sucursal de la cita. */
export function mapDtoToAppointment(dto: AppointmentDto, timeZone: string): Appointment {
  const startTime = timeIn(dto.scheduledStartAt, timeZone);
  const endTime = timeIn(dto.scheduledEndAt, timeZone);

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
    branchId: dto.branchId,
    timeZone,
    patientId: dto.patientId,
    patientName: dto.patientName,
    personName: dto.personName,
    patientPhone: dto.patientPhone || dto.personPhone,
    personPhone: dto.personPhone,
    serviceName,
    professionalId: dto.practitionerMembershipId || "",
    serviceId: dto.serviceId || serviceIds[0] || "",
    serviceIds,
    date: civilDateIn(dto.scheduledStartAt, timeZone),
    startTime,
    endTime,
    status: statusMap[dto.status] ?? "programada",
    notes: dto.notes ?? "",
    reason: dto.reason ?? undefined,
  };
}

export interface UseAgendaAppointmentsOptions {
  initialDate?: string;
}

export function useAgendaAppointments(options: UseAgendaAppointmentsOptions = {}) {
  // "Hoy" y la hora actual se leen en la zona de la organización.
  const timeZone = useTimeZone();
  const timeZoneOf = useTimeZoneResolver();
  // Reloj de la agenda: se actualiza cada minuto para recalcular las vencidas.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const today = todayIn(timeZone, now);
  const [date, setDate] = useState(() => options.initialDate || todayIn(timeZone));
  const [proFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"feed" | "grid">("feed");

  // TanStack Query: Consulta reactiva declarativa de citas por fecha
  const {
    data: appointmentsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAppointments({ date });

  // Mutaciones reactivas de TanStack Query
  const updateStatusMutation = useUpdateAppointmentStatus();
  const cancelAppointmentMutation = useCancelAppointment();

  // Mapeo declarativo de DTOs del servidor a modelos locales de vista
  const appointmentsList = useMemo(() => {
    if (!appointmentsData) return [];
    return appointmentsData.map((dto) => mapDtoToAppointment(dto, timeZoneOf(dto.branchId)));
  }, [appointmentsData, timeZoneOf]);

  // Citas de la semana visible, solo para marcar en la tira qué días tienen agenda.
  // La consulta depende de la semana (no del día): moverse dentro de ella no vuelve a pedirla.
  const weekStart = weekStartOf(date);
  const { data: weekData } = useAppointments({ startDate: weekStart, endDate: addDaysIso(weekStart, 6) });
  const weekCounts = useMemo(
    () =>
      countActiveByDate(
        (weekData ?? []).map((dto) => mapDtoToAppointment(dto, timeZoneOf(dto.branchId))),
      ),
    [weekData, timeZoneOf],
  );

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
  };

  const nowDateStr = today;
  const nowMinutes = minutesOfDayIn(now, timeZone);

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
      if (isAppointmentOverdue(apt, nowDateStr, nowMinutes, now)) {
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
  }, [appointmentsList, proFilter, statusFilter, nowDateStr, nowMinutes, now]);

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
  }, [date, statusFilter, appointmentsList, dayAppts]);

  const handleToggleExpand = (aptId: string) => {
    setExpandedId((prev) => (prev === aptId ? null : aptId));
  };

  const handleRefreshAppointments = async () => {
    // Recargar citas por fecha: fetchAppointments({ date }) mediante TanStack Query refetch
    await refetch();
  };

  const handleQuickStatusChange = async (
    aptId: string,
    newStatus: QuickStatus,
    onCompleted?: (apt: Appointment) => void,
  ) => {
    const apt = appointmentsList.find((a) => a.id === aptId);
    if (!apt) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: aptId,
        payload: {
          status: backendStatusMap[newStatus],
          notes: apt.notes,
        },
      });
    } catch (err) {
      console.error("Error al actualizar estado de la cita:", err);
    }

    if (newStatus === "completada" && onCompleted) {
      onCompleted({ ...apt, status: "completada" });
    }
  };

  // Contadores para chips y métricas
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

  return {
    date,
    setDate,
    changeDate,
    viewMode,
    setViewMode,
    statusFilter,
    setStatusFilter,
    appointmentsList,
    weekCounts,
    dayAppts,
    expandedId,
    setExpandedId,
    handleToggleExpand,
    isLoading,
    isError,
    error,
    refetch,
    handleRefreshAppointments,
    handleQuickStatusChange,
    updateStatusMutation,
    cancelAppointmentMutation,
    nowDateStr,
    nowMinutes,
    now,
    today,
    counters: {
      totalCount,
      waitingOrChair,
      confirmedCount,
      noShowCount,
    },
  };
}
