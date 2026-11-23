"use client";

import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_STYLES,
  type TodayAgendaRow,
} from "@/features/dashboard/utils/today-agenda";

type Props = {
  rows: readonly TodayAgendaRow[];
  onOpen: (appointmentId: string) => void;
};

function StatusBadge({ row }: { row: TodayAgendaRow }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md whitespace-nowrap ${APPOINTMENT_STATUS_STYLES[row.status]}`}
    >
      {APPOINTMENT_STATUS_LABELS[row.status]}
    </span>
  );
}

/**
 * Citas de hoy: tarjetas apiladas en móvil (la tabla no cabe y cortaba el
 * estado) y tabla desde 640 px.
 */
export function TodayAgendaList({ rows, onOpen }: Props) {
  return (
    <>
      <ul className="divide-y divide-[var(--border)] sm:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onOpen(row.id)}
              className="flex w-full min-h-14 items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--background)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary)]/40"
            >
              <span className="w-12 shrink-0 pt-0.5 font-mono text-xs font-medium leading-tight text-[var(--foreground)]">
                {row.startTime}
                <span className="block text-[var(--muted)]">{row.endTime}</span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-display text-sm font-semibold text-[var(--foreground)]">{row.patientName}</span>
                {row.serviceLabel && <span className="truncate text-xs text-[var(--muted)]">{row.serviceLabel}</span>}
              </span>
              <span className="shrink-0 pt-0.5">
                <StatusBadge row={row} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
              {["Hora", "Paciente", "Servicio", "Estado"].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onOpen(row.id)}
                className="hover:bg-[var(--background)]/60 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3.5 text-xs font-mono font-medium text-[var(--foreground)] whitespace-nowrap">
                  {row.startTime} – {row.endTime}
                </td>
                <td className="px-4 py-3.5 text-sm font-display font-semibold text-[var(--foreground)]">
                  {row.patientName}
                </td>
                <td className="px-4 py-3.5 text-sm text-[var(--muted)]">{row.serviceLabel ?? "—"}</td>
                <td className="px-4 py-3.5">
                  <StatusBadge row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
