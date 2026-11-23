"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button, buttonClassName, Icons } from "@/shared/components/ui";
import { appointmentEncounterOptions } from "@/features/clinical-encounter/api/query-options";
import {
  ENCOUNTER_STATUS_LABELS,
  encounterHref,
  newEncounterHref,
  resolveAppointmentEncounterActions,
  type AppointmentEncounterLookup,
} from "@/features/clinical-encounter/utils/appointment-encounter";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

export interface AppointmentEncounterActionsProps {
  patientId: string;
  appointmentId: string;
  /** Estado del backend (`SCHEDULED`…) o de la vista de agenda (`programada`…). */
  appointmentStatus: string;
  onRegisterProcedure: () => void;
  /** `card`: fila compacta de la tarjeta; `panel`: bloque con título del detalle. */
  layout?: "card" | "panel";
}

/** "Atender" y "Registrar procedimiento" de una cita, o "Ver atención" si ya tiene una. */
export function AppointmentEncounterActions({
  patientId,
  appointmentId,
  appointmentStatus,
  onRegisterProcedure,
  layout = "card",
}: AppointmentEncounterActionsProps) {
  const session = useAuthenticatedSession();
  const canRead = session.permissions.includes("dentistry:encounters:read");
  const query = useQuery({
    ...appointmentEncounterOptions(patientId, appointmentId),
    enabled: canRead,
  });
  const lookup: AppointmentEncounterLookup = !canRead
    ? { state: "unknown" }
    : query.isPending
      ? { state: "pending" }
      : // Si la consulta falla se ofrecen las acciones: el backend rechaza un duplicado.
        { state: "ready", encounter: query.data ?? null };
  const actions = resolveAppointmentEncounterActions({
    appointmentStatus,
    permissions: session.permissions,
    plan: session.plan,
    lookup,
  });

  if (actions.kind === "hidden") return null;

  // Texto sm en ambos casos; en el detalle, objetivo táctil de 48 px.
  const size = "md";
  // Con menos de ~25rem disponibles los botones se apilan a ancho completo y en una línea.
  // En la tarjeta, desde `sm` toman su ancho natural para no estirarse en escritorio.
  const itemClass = [
    "min-w-[12rem] flex-1 whitespace-nowrap",
    layout === "panel" ? "h-12" : "sm:flex-none",
  ].join(" ");
  let content;
  if (actions.kind === "loading") {
    content = (
      <div
        role="status"
        aria-label="Consultando la atención de la cita"
        className="h-10 w-full animate-pulse rounded-[var(--radius)] bg-[var(--neutral-subtle)]"
      />
    );
  } else if (actions.kind === "existing") {
    const inProgress = actions.encounterStatus === "IN_PROGRESS";
    content = (
      <>
        <span className="flex min-w-0 basis-full items-center gap-1.5 text-xs text-[var(--muted)]">
          <span className="flex h-3.5 w-3.5 shrink-0 items-center" aria-hidden="true">{Icons.tooth}</span>
          {ENCOUNTER_STATUS_LABELS[actions.encounterStatus]}
        </span>
        {actions.canView && (
          <Link
            href={encounterHref(patientId, actions.encounterId)}
            className={buttonClassName({ variant: inProgress ? "primary" : "outline", size, className: itemClass })}
          >
            <span className="flex shrink-0 items-center" aria-hidden="true">{Icons.eye}</span>
            {inProgress ? "Continuar atención" : "Ver atención"}
          </Link>
        )}
      </>
    );
  } else {
    content = (
      <>
        {actions.canAttend && (
          <Link
            href={newEncounterHref(patientId, appointmentId)}
            className={buttonClassName({ variant: "primary", size, className: itemClass })}
          >
            <span className="flex shrink-0 items-center" aria-hidden="true">{Icons.tooth}</span>
            Atender
          </Link>
        )}
        {actions.canRegisterProcedure && (
          <Button
            variant="outline"
            size={size}
            leftIcon={Icons.plus}
            onClick={onRegisterProcedure}
            className={itemClass}
          >
            Registrar procedimiento
          </Button>
        )}
      </>
    );
  }

  if (layout === "card") {
    return <div className="mt-3 flex flex-wrap items-center gap-2">{content}</div>;
  }
  return (
    <section
      aria-label="Atención clínica"
      className="flex flex-col gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5"
    >
      <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--muted)]">
        Atención clínica
      </span>
      <div className="flex flex-wrap items-center gap-2">{content}</div>
    </section>
  );
}
