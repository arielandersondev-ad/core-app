"use client";

import {
  Appointment,
  getServiceById,
  statusLabels,
} from "@/modules/clinic/__mocks__/data";
import { Icons } from "@/shared/components/ui/Icons";
import { normalizePhoneNumber } from "@/shared/utils/whatsapp-generator";
import {
  formatLocalPhone,
  getDoctorDisplay,
  isPersonaAppointment,
  isAppointmentOverdue,
  timeToMinutes,
  type QuickStatus,
} from "./hooks/useAgendaAppointments";

interface AgendaAppointmentCardProps {
  appointment: Appointment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenDetail: () => void;
  onOpenWhatsApp: () => void;
  onStatusChange: (newStatus: QuickStatus) => void;
  nowDateStr: string;
  nowMinutes: number;
}

export function AgendaAppointmentCard({
  appointment: apt,
  isExpanded,
  onToggleExpand,
  onOpenDetail,
  onOpenWhatsApp,
  onStatusChange,
  nowDateStr,
  nowMinutes,
}: AgendaAppointmentCardProps) {
  const isOverdue = isAppointmentOverdue(apt, nowDateStr, nowMinutes);
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

  return (
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
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="text-left font-display text-base font-bold text-[var(--foreground)] underline decoration-dotted decoration-[var(--muted)]/70 underline-offset-4 hover:decoration-[var(--primary)] hover:text-[var(--primary)] transition-colors truncate cursor-pointer"
          >
            {patientName}
          </button>
          {isPerson ? (
            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[9px] font-medium px-1.5 py-0.5 rounded">
              Persona
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-medium px-1.5 py-0.5 rounded">
              Paciente
            </span>
          )}
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
          aria-label={isExpanded ? "Colapsar cita" : "Expandir cita"}
          className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] transition-colors rounded-lg shrink-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
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
          onClick={onToggleExpand}
        >
          <p className="text-sm text-[var(--muted)] truncate">
            {svcName} · {durationMin} min
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--muted)]">
            {doctor ? (
              <span className="truncate">{doctor.name}</span>
            ) : (
              <span className="text-[9px] px-1 py-0.2 rounded bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                Por asignar
              </span>
            )}
          </div>
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
          <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
            {doctor ? (
              <span className="truncate">{doctor.name}</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
                Por asignar
              </span>
            )}
          </div>
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
              onClick={onOpenWhatsApp}
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
                    onStatusChange("confirmada");
                  } else if (apt.status === "confirmada") {
                    onStatusChange("en_sala");
                  } else if (apt.status === "en_sala") {
                    onStatusChange("en_curso");
                  } else if (apt.status === "en_curso") {
                    onStatusChange("completada");
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
                    onClick={() => onStatusChange("no_asistio")}
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
  );
}
