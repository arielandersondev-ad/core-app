import type { AppointmentDto } from "@/modules/clinic/api/appointments";
import { timeIn, wallPartsIn } from "@/shared/time/zoned-time";

type AppointmentStatus = AppointmentDto["status"];

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  WAITING_ROOM: "En sala de espera",
  IN_PROGRESS: "En sillón",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
  CANCELED: "Cancelada",
};

export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-[var(--neutral-subtle)] text-[var(--muted)] border border-[var(--border)]",
  CONFIRMED: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25",
  WAITING_ROOM: "bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/25",
  IN_PROGRESS: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25",
  COMPLETED: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20",
  NO_SHOW: "bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/25",
  CANCELED: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/25",
};

export type TodayAgendaRow = {
  id: string;
  startTime: string;
  endTime: string;
  patientName: string;
  serviceLabel: string | null;
  status: AppointmentStatus;
};

/** Citas del día sin las canceladas, por hora de inicio y en la hora de su sucursal. */
export function toTodayAgenda(
  appointments: readonly AppointmentDto[],
  timeZoneOf: (branchId?: string | null) => string,
): TodayAgendaRow[] {
  return appointments
    .filter((appointment) => appointment.status !== "CANCELED")
    .sort((a, b) => Date.parse(a.scheduledStartAt) - Date.parse(b.scheduledStartAt))
    .map((appointment) => {
      const timeZone = timeZoneOf(appointment.branchId);
      return {
        id: appointment.id,
        startTime: timeIn(appointment.scheduledStartAt, timeZone),
        endTime: timeIn(appointment.scheduledEndAt, timeZone),
        patientName: appointment.patientName || appointment.personName || "Paciente sin nombre",
        serviceLabel: serviceLabel(appointment),
        status: appointment.status,
      };
    });
}

function serviceLabel(appointment: AppointmentDto): string | null {
  const names = (appointment.services ?? [])
    .map((service) => service.serviceName)
    .filter((name): name is string => Boolean(name));
  const first = appointment.serviceName || names[0];
  if (!first) return null;
  const extra = Math.max(names.length - 1, 0);
  return extra > 0 ? `${first} +${extra}` : first;
}

export function summarizeToday(rows: readonly TodayAgendaRow[]) {
  return {
    total: rows.length,
    completed: rows.filter((row) => row.status === "COMPLETED").length,
    inProgress: rows.filter((row) => row.status === "WAITING_ROOM" || row.status === "IN_PROGRESS").length,
  };
}

/** Saludo según la hora de pared de la organización. */
export function greetingAt(now: Date, timeZone: string): string {
  const { hour } = wallPartsIn(now, timeZone);
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}
