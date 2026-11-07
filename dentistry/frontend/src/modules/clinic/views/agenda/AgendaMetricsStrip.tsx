"use client";

import { useMemo } from "react";
import { CompactStatSummary, type CompactStatItem } from "@app/ui";

interface AgendaMetricsStripProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  totalCount: number;
  waitingOrChair: number;
  confirmedCount: number;
  noShowCount: number;
}

export function AgendaMetricsStrip({
  statusFilter,
  onStatusFilterChange,
  totalCount,
  waitingOrChair,
  confirmedCount,
  noShowCount,
}: AgendaMetricsStripProps) {
  const statItems: CompactStatItem[] = useMemo(
    () => [
      {
        id: "all",
        label: "Todas",
        value: totalCount,
        active: statusFilter === "all",
        onClick: () => onStatusFilterChange("all"),
        variant: "neutral",
      },
      ...(waitingOrChair > 0
        ? [
            {
              id: "activas",
              label: "En clínica",
              value: waitingOrChair,
              active: statusFilter === "activas",
              onClick: () => onStatusFilterChange("activas"),
              variant: "warning" as const,
            },
          ]
        : []),
      {
        id: "confirmada",
        label: "Confirmadas",
        value: confirmedCount,
        active: statusFilter === "confirmada",
        onClick: () => onStatusFilterChange("confirmada"),
        variant: "success",
      },
      ...(noShowCount > 0
        ? [
            {
              id: "no_asistio",
              label: "No asistió",
              value: noShowCount,
              active: statusFilter === "no_asistio",
              onClick: () => onStatusFilterChange("no_asistio"),
              variant: "danger" as const,
            },
          ]
        : []),
    ],
    [statusFilter, totalCount, waitingOrChair, confirmedCount, noShowCount, onStatusFilterChange],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* ── FRAPESTAT MINIMALISTA (COMPACT STAT SUMMARY) ── */}
      <CompactStatSummary
        items={statItems}
        variant="pill"
        className="py-1"
      />

      {/* ── CHIPS DE FILTRO RÁPIDO ── */}
      <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar text-xs py-1">
        <button
          type="button"
          onClick={() => onStatusFilterChange("all")}
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
            type="button"
            onClick={() => onStatusFilterChange("activas")}
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
          type="button"
          onClick={() => onStatusFilterChange("confirmada")}
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
          type="button"
          onClick={() => onStatusFilterChange("programada")}
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
            type="button"
            onClick={() => onStatusFilterChange("no_asistio")}
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
    </div>
  );
}
