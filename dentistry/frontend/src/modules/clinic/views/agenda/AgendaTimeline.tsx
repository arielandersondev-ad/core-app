"use client";

import { Fragment } from "react";
import {
  Appointment,
  getServiceById,
  statusColors,
  statusLabels,
} from "@/modules/clinic/__mocks__/data";
import { EmptyState, Button } from "@/shared/components/ui";
import { AgendaAppointmentCard } from "./AgendaAppointmentCard";
import {
  formatLocalPhone,
  getDoctorDisplay,
  isPersonaAppointment,
  isAppointmentOverdue,
  timeToMinutes,
  getTimelineDotColor,
  HOURS,
  type QuickStatus,
} from "./hooks/useAgendaAppointments";

interface AgendaTimelineProps {
  viewMode: "feed" | "grid";
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  dayAppts: Appointment[];
  expandedId: string | null;
  onToggleExpand: (aptId: string) => void;
  nowDateStr: string;
  nowMinutes: number;
  onOpenCreateModal: () => void;
  onOpenDetail: (aptId: string) => void;
  onOpenWhatsApp: (apt: Appointment) => void;
  onStatusChange: (aptId: string, newStatus: QuickStatus) => void;
}

export function AgendaTimeline({
  viewMode,
  isLoading,
  isError,
  onRetry,
  dayAppts,
  expandedId,
  onToggleExpand,
  nowDateStr,
  nowMinutes,
  onOpenCreateModal,
  onOpenDetail,
  onOpenWhatsApp,
  onStatusChange,
}: AgendaTimelineProps) {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── ESTADO DE ERROR DECLARATIVO ── */}
      {isError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <span>
              No pudimos conectar con el servidor para obtener las citas. Inténtalo nuevamente.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0 rounded-xl border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/15"
          >
            Reintentar
          </Button>
        </div>
      )}

      {viewMode === "feed" ? (
        <div className="flex flex-col gap-3 h-full">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-4">
              <div className="p-6 text-center text-xs font-mono text-[var(--muted)] animate-pulse bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span>Cargando agenda de citas...</span>
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex gap-3 sm:gap-4 items-stretch opacity-60 animate-pulse"
                >
                  <div className="w-12 sm:w-14 flex flex-col items-center pt-3.5 shrink-0">
                    <div className="h-4 w-10 bg-[var(--border)] rounded" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--border)] mt-2" />
                    <div className="w-px flex-1 bg-[var(--border)] my-1.5" />
                  </div>
                  <div className="flex-1 min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 flex flex-col gap-2.5">
                    <div className="h-4 w-1/3 bg-[var(--border)] rounded" />
                    <div className="h-3 w-1/2 bg-[var(--border)]/60 rounded" />
                  </div>
                </div>
              ))}
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
                  onClick={onOpenCreateModal}
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

                    {/* 2) Columna Derecha — Tarjeta Desplegable */}
                    <AgendaAppointmentCard
                      appointment={apt}
                      isExpanded={expandedId === apt.id}
                      onToggleExpand={() => onToggleExpand(apt.id)}
                      onOpenDetail={() => onOpenDetail(apt.id)}
                      onOpenWhatsApp={() => onOpenWhatsApp(apt)}
                      onStatusChange={(status) => onStatusChange(apt.id, status)}
                      nowDateStr={nowDateStr}
                      nowMinutes={nowMinutes}
                    />
                  </div>
                </Fragment>
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
                    onClick={() => onOpenDetail(apt.id)}
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
    </div>
  );
}
