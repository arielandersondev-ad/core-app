import type { ReactNode } from "react";
import { Badge, type BadgeSize } from "./Badge";

export type ContactType = "patient" | "person";

export interface ContactTypeBadgeProps {
  type: ContactType;
  label?: string;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
  icon?: ReactNode;
}

/**
 * ContactTypeBadge
 *
 * Badge visual de contacto/titular para distinguir claramente entre:
 * - `patient`: "Paciente" (estilo esmeralda suave / éxito clínico)
 * - `person`: "Persona" (estilo ámbar / neutro suave para ingresos rápidos y contactos sin historia clínica completa)
 */
export function ContactTypeBadge({
  type,
  label,
  size = "sm",
  dot = true,
  className = "",
  icon,
}: ContactTypeBadgeProps) {
  const isPatient = type === "patient";
  const defaultLabel = isPatient ? "Paciente" : "Persona";
  const text = label ?? defaultLabel;

  return (
    <Badge
      variant={isPatient ? "patient" : "person"}
      size={size}
      dot={dot && !icon}
      className={`font-semibold ${className}`}
    >
      {icon && <span className="mr-1 inline-flex shrink-0 items-center">{icon}</span>}
      {text}
    </Badge>
  );
}

export type AppointmentStatusKey =
  | "SCHEDULED"
  | "CONFIRMED"
  | "WAITING_ROOM"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELED"
  | "programada"
  | "confirmada"
  | "en_sala"
  | "en_curso"
  | "completada"
  | "no_asistio"
  | "cancelada";

export const appointmentStatusConfig: Record<
  string,
  { label: string; dotColor: string; className: string }
> = {
  SCHEDULED: {
    label: "Programada",
    dotColor: "bg-stone-400 dark:bg-stone-500",
    className:
      "bg-[var(--neutral-subtle)] text-[var(--muted)] border border-[var(--border)]",
  },
  programada: {
    label: "Programada",
    dotColor: "bg-stone-400 dark:bg-stone-500",
    className:
      "bg-[var(--neutral-subtle)] text-[var(--muted)] border border-[var(--border)]",
  },
  CONFIRMED: {
    label: "Confirmada",
    dotColor: "bg-emerald-600 dark:bg-emerald-400",
    className:
      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25",
  },
  confirmada: {
    label: "Confirmada",
    dotColor: "bg-emerald-600 dark:bg-emerald-400",
    className:
      "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25",
  },
  WAITING_ROOM: {
    label: "En sala de espera",
    dotColor: "bg-[var(--secondary)]",
    className:
      "bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/25",
  },
  en_sala: {
    label: "En sala de espera",
    dotColor: "bg-[var(--secondary)]",
    className:
      "bg-[var(--secondary)]/10 text-[var(--secondary)] border border-[var(--secondary)]/25",
  },
  IN_PROGRESS: {
    label: "En curso (Sillón)",
    dotColor: "bg-amber-600 dark:bg-amber-400",
    className:
      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25",
  },
  en_curso: {
    label: "En sillón",
    dotColor: "bg-amber-600 dark:bg-amber-400",
    className:
      "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25",
  },
  COMPLETED: {
    label: "Completada",
    dotColor: "bg-zinc-400",
    className:
      "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20",
  },
  completada: {
    label: "Completada",
    dotColor: "bg-zinc-400",
    className:
      "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border border-zinc-500/20",
  },
  NO_SHOW: {
    label: "No asistió",
    dotColor: "bg-orange-500",
    className:
      "bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/25",
  },
  no_asistio: {
    label: "No asistió",
    dotColor: "bg-orange-500",
    className:
      "bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/25",
  },
  CANCELED: {
    label: "Cancelada",
    dotColor: "bg-rose-500",
    className:
      "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/25",
  },
  cancelada: {
    label: "Cancelada",
    dotColor: "bg-rose-500",
    className:
      "bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/25",
  },
};

export interface AppointmentStatusBadgeProps {
  status: AppointmentStatusKey | string;
  label?: string;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

/**
 * AppointmentStatusBadge
 *
 * Badge estándar para reflejar los estados clínicos y de flujo de citas.
 * Soporta claves canónicas (SCHEDULED, CONFIRMED, etc.) y descriptivas en español.
 */
export function AppointmentStatusBadge({
  status,
  label,
  size = "sm",
  dot = true,
  className = "",
}: AppointmentStatusBadgeProps) {
  const config =
    appointmentStatusConfig[status] ?? appointmentStatusConfig.SCHEDULED;
  const displayText = label ?? config.label;

  const sizeClass =
    size === "md"
      ? "min-h-6 gap-2 px-2.5 py-1 text-xs"
      : "min-h-5 gap-1.5 px-2 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex w-fit items-center rounded-md font-medium leading-none ${config.className} ${sizeClass} ${className}`}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={`size-1.5 shrink-0 rounded-full ${config.dotColor}`}
        />
      )}
      {displayText}
    </span>
  );
}
