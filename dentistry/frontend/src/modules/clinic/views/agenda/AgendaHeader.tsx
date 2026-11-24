"use client";

import { useMemo } from "react";
import { addDaysIso, weekDaysOf } from "./week";

interface AgendaHeaderProps {
  date: string;
  /** "Hoy" (`YYYY-MM-DD`) en la zona horaria de la organización. */
  today: string;
  /** Citas por día (`YYYY-MM-DD`) de la semana visible; los días sin citas no aparecen. */
  dayCounts: Record<string, number>;
  onDateChange: (date: string) => void;
  viewMode: "feed" | "grid";
  onViewModeChange: (mode: "feed" | "grid") => void;
  totalCount: number;
  onOpenCreateModal: () => void;
}

export function AgendaHeader({
  date,
  today,
  dayCounts,
  onDateChange,
  viewMode,
  onViewModeChange,
  totalCount,
  onOpenCreateModal,
}: AgendaHeaderProps) {
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

  // Semana fija (lunes a domingo): el día elegido se mueve dentro de ella, la tira no se desplaza.
  const weekDays = useMemo(
    () =>
      weekDaysOf(date).map((iso) => {
        const cur = new Date(iso + "T12:00:00");
        return {
          iso,
          dayName: cur.toLocaleDateString("es-BO", { weekday: "narrow" }),
          longLabel: cur.toLocaleDateString("es-BO", { weekday: "long", day: "numeric", month: "long" }),
          dayNum: cur.getDate(),
          isCurrentDay: iso === date,
          isToday: iso === today,
          count: dayCounts[iso] ?? 0,
        };
      }),
    [date, today, dayCounts],
  );

  return (
    <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
      {/* Fila Superior: Navegación de Mes/Año + Controles de Modo y Hoy (Sin botón +) */}
      <div className="flex items-center justify-between gap-2">
        {/* Mes actual con chevrons flotantes */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDateChange(addDaysIso(date, -1))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95"
            aria-label="Día anterior"
            title="Día anterior"
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
            onClick={() => onDateChange(addDaysIso(date, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--background)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors active:scale-95"
            aria-label="Día siguiente"
            title="Día siguiente"
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
              onClick={() => onViewModeChange("feed")}
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
              onClick={() => onViewModeChange("grid")}
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
            onClick={() => onDateChange(today)}
            className={`px-3.5 h-8 text-xs font-semibold rounded-full border transition-all active:scale-95 shadow-2xs ${
              date === today
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--background)]"
            }`}
          >
            Hoy
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
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
            onClick={() => onDateChange(wd.iso)}
            aria-pressed={wd.isCurrentDay}
            aria-label={`${wd.longLabel}${wd.count > 0 ? `, ${wd.count} cita${wd.count === 1 ? "" : "s"}` : ", sin citas"}`}
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
            <span className="relative">
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
              {wd.count > 0 && (
                <span
                  aria-hidden="true"
                  data-testid="agenda-day-badge"
                  className="absolute -top-1 -right-1.5 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)] text-[9px] font-bold leading-none ring-2 ring-[var(--surface-elevated)]"
                >
                  {wd.count > 9 ? "9+" : wd.count}
                </span>
              )}
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
  );
}
