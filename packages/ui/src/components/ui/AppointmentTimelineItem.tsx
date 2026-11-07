"use client";

import { useState } from "react";
import { Icons } from "./Icons";

export type AppointmentTimelineStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "WAITING_ROOM"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELED";

export interface AppointmentTimelineItemData {
  id: string;
  startTime: string; // e.g. "05:00", "05:45"
  endTime?: string;
  durationMin?: number;
  status: AppointmentTimelineStatus;
  contactName: string;
  serviceName: string;
  notes?: string;
  phone?: string;
  price?: number;
  isOverdue?: boolean;
}

export interface AppointmentTimelineItemProps {
  appointment: AppointmentTimelineItemData;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onNameClick?: () => void;
  isLast?: boolean;
  onConfirm?: () => void;
  onNoShow?: () => void;
  onWhatsApp?: () => void;
  onCall?: () => void;
  isOverdue?: boolean;
  className?: string;
}

/**
 * Retorna la clase CSS del punto de estado en el Timeline lateral:
 * - SCHEDULED: ámbar (bg-amber-400)
 * - CONFIRMED / COMPLETED: verde (bg-emerald-500)
 * - NO_SHOW / CANCELED: coral/rojo (bg-rose-500)
 * - WAITING_ROOM / IN_PROGRESS: azul/ámbar de transición
 */
export function getTimelineStatusDotClass(status: AppointmentTimelineStatus): string {
  switch (status) {
    case "SCHEDULED":
      return "bg-amber-400";
    case "CONFIRMED":
    case "COMPLETED":
      return "bg-emerald-500";
    case "NO_SHOW":
    case "CANCELED":
      return "bg-rose-500";
    case "WAITING_ROOM":
    case "IN_PROGRESS":
      return "bg-sky-500";
    default:
      return "bg-amber-400";
  }
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

const OVERDUE_STATUSES = new Set([
  "SCHEDULED",
  "CONFIRMED",
  "NO_SHOW",
  "programada",
  "confirmada",
  "no_asistio",
]);

/**
 * Ordena las citas de forma inteligente para la vista Timeline:
 * - Primero las citas actuales y posteriores (ordenadas ascendentemente por startTime).
 * - Al final las citas vencidas (cuya hora ya pasó y no asistió o marcadas isOverdue: true, ordenadas ascendentemente por startTime).
 */
export function sortAppointmentsByTimelinePriority<
  T extends { startTime: string; endTime?: string; status?: string; isOverdue?: boolean }
>(items: T[], currentMinutes?: number): T[] {
  const currentOrUpcoming: T[] = [];
  const overdue: T[] = [];

  for (const item of items) {
    let isItemOverdue = Boolean(item.isOverdue);

    if (!isItemOverdue && currentMinutes !== undefined) {
      const compareTime = item.endTime || item.startTime;
      const itemMinutes = parseTimeToMinutes(compareTime);
      const itemStatus = item.status || "SCHEDULED";
      if (itemMinutes < currentMinutes && OVERDUE_STATUSES.has(itemStatus)) {
        isItemOverdue = true;
      }
    }

    if (isItemOverdue) {
      overdue.push(isItemOverdue !== Boolean(item.isOverdue) ? { ...item, isOverdue: true } : item);
    } else {
      currentOrUpcoming.push(item);
    }
  }

  currentOrUpcoming.sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  );
  overdue.sort(
    (a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime)
  );

  return [...currentOrUpcoming, ...overdue];
}

/**
 * AppointmentTimelineItem
 * Fila de cita con Timeline lateral conectada (hora + punto de estado + riel vertical)
 * y tarjeta acordeón colapsable/expandible con acciones táctiles directas.
 */
export function AppointmentTimelineItem({
  appointment,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onNameClick,
  isLast = false,
  onConfirm,
  onNoShow,
  onWhatsApp,
  onCall,
  isOverdue,
  className = "",
}: AppointmentTimelineItemProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const overdue = Boolean(isOverdue ?? appointment.isOverdue);

  const handleToggle = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  const dotClass = overdue
    ? "bg-rose-500 ring-3 ring-rose-500/20"
    : getTimelineStatusDotClass(appointment.status);

  const durationText = appointment.durationMin ? `${appointment.durationMin} min` : undefined;

  return (
    <div
      data-testid={`appointment-timeline-row-${appointment.id}`}
      className={`flex gap-3 sm:gap-4 items-stretch ${className}`}
    >
      {/* Columna Izquierda: Riel de Timeline */}
      <div className="w-12 sm:w-14 flex flex-col items-center pt-3 select-none shrink-0">
        <span
          className={`font-mono text-sm sm:text-base font-bold tracking-tight ${
            overdue
              ? "text-rose-500/80 dark:text-rose-400/80 line-through decoration-rose-500/50"
              : "text-[var(--foreground)]"
          }`}
        >
          {appointment.startTime}
        </span>
        <span
          data-testid="timeline-status-dot"
          className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${dotClass}`}
          aria-hidden="true"
        />
        {!isLast && (
          <div
            data-testid="timeline-vertical-line"
            className={
              overdue
                ? "w-px flex-1 border-l border-dashed border-rose-500/30 dark:border-rose-400/25 bg-transparent mt-2"
                : "w-px flex-1 bg-[var(--border)] mt-2"
            }
            aria-hidden="true"
          />
        )}
      </div>

      {/* Columna Derecha: Tarjeta Acordeón */}
      <div className="flex-1 pb-3 sm:pb-4 min-w-0">
        <div
          data-testid={`appointment-card-accordion-${appointment.id}`}
          className={`rounded-2xl border p-4 transition-all shadow-2xs ${
            overdue
              ? "border-dashed border-rose-500/35 dark:border-rose-400/30 bg-rose-500/[0.03] dark:bg-rose-950/10 opacity-75 hover:opacity-100"
              : "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--primary)]/30"
          }`}
        >
          {/* Cabecera Clickeable */}
          <button
            type="button"
            onClick={handleToggle}
            aria-expanded={isExpanded}
            className="w-full text-left flex items-start justify-between gap-3 cursor-pointer group/header"
          >
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-bold text-[var(--foreground)] group-hover/header:text-[var(--primary)] transition-colors truncate flex items-center gap-2 flex-wrap">
                <span
                  onClick={(e) => {
                    if (onNameClick) {
                      e.stopPropagation();
                      onNameClick();
                    }
                  }}
                  className="underline decoration-dotted decoration-[var(--muted)]/70 underline-offset-4 hover:decoration-[var(--primary)] inline-block"
                >
                  {appointment.contactName}
                </span>

                {overdue && (
                  <span
                    data-testid="appointment-overdue-badge"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 shrink-0"
                  >
                    ⏰ Vencida
                  </span>
                )}
              </h4>

              {/* Teléfono sutil debajo del nombre SOLO cuando está expandida */}
              {isExpanded && appointment.phone && (
                <p
                  data-testid="appointment-expanded-phone"
                  className="text-[11px] font-mono text-[var(--muted)]/75 leading-tight mt-0.5"
                >
                  {appointment.phone}
                </p>
              )}

              {/* Subtítulo según estado colapsado / expandido */}
              {!isExpanded ? (
                <p className="text-sm text-[var(--muted)] truncate mt-0.5">
                  {durationText ? `${appointment.serviceName} · ${durationText}` : appointment.serviceName}
                </p>
              ) : (
                <p className="text-sm text-[var(--muted)] truncate mt-0.5">
                  {appointment.serviceName}
                </p>
              )}
            </div>

            {/* Icono Chevron */}
            <span
              className="w-5 h-5 flex items-center justify-center text-[var(--muted)] group-hover/header:text-[var(--foreground)] transition-transform shrink-0 pt-0.5"
              aria-hidden="true"
            >
              {isExpanded ? (
                Icons.chevronUp || (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                )
              ) : (
                Icons.chevronDown || (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )
              )}
            </span>
          </button>

          {/* Fila de notas si existe (visible tanto colapsada como expandida) */}
          {appointment.notes && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400/90 truncate">
              <span className="shrink-0 text-amber-500/90" aria-hidden="true">
                📄
              </span>
              <span className="truncate">{appointment.notes}</span>
            </div>
          )}

          {/* Detalle Expandido */}
          {isExpanded && (
            <div className="mt-3.5 pt-3 border-t border-[var(--border)]/50 space-y-3 animate-in fade-in-50 duration-150">
              {/* Fila de Acciones: WhatsApp + Llamada + Botón Confirmar */}
              <div className="flex items-center gap-2">
                {/* Botón WhatsApp */}
                <button
                  type="button"
                  onClick={onWhatsApp}
                  title="Contactar por WhatsApp"
                  aria-label="Contactar por WhatsApp"
                  className="h-10 w-12 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] flex items-center justify-center text-[#25D366] transition-colors cursor-pointer shrink-0"
                >
                  <span className="w-5 h-5 flex items-center justify-center">
                    {Icons.whatsappReal || Icons.whatsapp}
                  </span>
                </button>

                {/* Botón Llamada */}
                <button
                  type="button"
                  onClick={onCall}
                  title="Llamar al paciente"
                  aria-label="Llamar al paciente"
                  className="h-10 w-12 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--surface)] flex items-center justify-center text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
                >
                  <span className="w-4 h-4 flex items-center justify-center text-[var(--muted)]">
                    {Icons.phoneCall || Icons.phone}
                  </span>
                </button>

                {/* Botón Primario Ancho Verde: Confirmar */}
                <button
                  type="button"
                  onClick={onConfirm}
                  className="flex-1 h-10 rounded-xl bg-[#6cc24a] hover:bg-[#5db33c] active:bg-[#52a134] text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <span className="w-4 h-4 flex items-center justify-center font-bold">
                    ✓
                  </span>
                  <span>Confirmar</span>
                </button>
              </div>

              {/* Fila Inferior del Acordeón: No asistió + Duración */}
              <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1">
                <button
                  type="button"
                  onClick={onNoShow}
                  className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer font-medium"
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="18" y1="8" x2="23" y2="13" />
                      <line x1="23" y1="8" x2="18" y2="13" />
                    </svg>
                  </span>
                  <span>No asistió</span>
                </button>

                {durationText && (
                  <span className="font-mono text-xs text-[var(--muted)]">
                    {durationText}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
