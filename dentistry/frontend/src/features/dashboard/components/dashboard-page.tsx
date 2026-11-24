"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { patientListOptions } from "@/features/patient/api/query-options";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { CreateAppointmentModal } from "@/modules/clinic/components";
import { useAppointments } from "@/modules/clinic/hooks";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Button, EmptyState, Icons, StatCard } from "@/shared/components/ui";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { userFirstName } from "@/shared/session/display-names";
import { useTimeZone, useTimeZoneResolver } from "@/shared/time/use-time-zone";
import { formatInZone, todayIn } from "@/shared/time/zoned-time";
import { greetingAt, summarizeToday, toTodayAgenda } from "@/features/dashboard/utils/today-agenda";
import { TodayAgendaList } from "./today-agenda-list";

type QuickAction = {
  label: string;
  icon: ReactNode;
  /** Marca de "+" para distinguir crear de consultar. */
  creates?: boolean;
  onClick: () => void;
};

/** Inicio: agenda real de hoy primero y, debajo, los totales del día. */
export function DashboardPage() {
  const router = useRouter();
  const session = useAuthenticatedSession();
  const timeZone = useTimeZone();
  const timeZoneOf = useTimeZoneResolver();
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);

  const now = new Date();
  const firstName = userFirstName(session);
  const greeting = greetingAt(now, timeZone);
  const today = todayIn(timeZone, now);
  const can = (permission: string) => session.permissions.includes(permission);
  const hasModule = (module: Parameters<typeof isModuleEnabled>[1]) => isModuleEnabled(session.plan, module);

  const appointmentsQuery = useAppointments({ date: today });
  // Solo interesa el total: una fila basta para leer la paginación.
  const activePatientsQuery = useQuery(patientListOptions({ status: "ACTIVE", page: 1, pageSize: 1 }));

  const rows = useMemo(
    () => toTodayAgenda(appointmentsQuery.data ?? [], timeZoneOf),
    [appointmentsQuery.data, timeZoneOf],
  );
  const summary = summarizeToday(rows);

  const actions: QuickAction[] = [
    ...(hasModule("agenda") && can("dentistry:appointments:create")
      ? [{ label: "Nueva cita", icon: Icons.calendar, creates: true, onClick: () => setIsAppointmentOpen(true) }]
      : []),
    ...(hasModule("patients") && can("dentistry:patients:create")
      ? [{ label: "Nuevo paciente", icon: Icons.user, creates: true, onClick: () => router.push("/patients?create=true") }]
      : []),
    ...(hasModule("payments")
      ? [{ label: "Registrar pago", icon: Icons.payments, onClick: () => router.push("/register-payment") }]
      : []),
    ...(hasModule("agenda")
      ? [{ label: "Ver agenda", icon: Icons.agenda, onClick: () => router.push("/agenda") }]
      : []),
  ];

  const formattedDate = formatInZone(now, timeZone, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <PageContainer>
      <PageHeader
        title={firstName ? `${greeting}, ${firstName}` : greeting}
        description="Agenda del día y resumen de la clínica"
        badge={
          <span className="px-2.5 py-1 rounded-md bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)] text-xs font-mono capitalize">
            Hoy · {formattedDate}
          </span>
        }
        action={actions.length > 0 ? <QuickActions actions={actions} /> : undefined}
      />

      <section aria-labelledby="dashboard-agenda-heading" className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2
            id="dashboard-agenda-heading"
            className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold"
          >
            Agenda de hoy
          </h2>
          <button
            type="button"
            onClick={() => router.push("/agenda")}
            className="text-xs text-[var(--primary)] font-mono hover:underline cursor-pointer"
          >
            Ver agenda completa →
          </button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
          {appointmentsQuery.isPending ? (
            <p role="status" className="px-4 py-10 text-center text-sm text-[var(--muted)]">
              Cargando la agenda de hoy…
            </p>
          ) : appointmentsQuery.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center text-sm">
              <p className="text-[var(--foreground)]">No se pudo cargar la agenda de hoy.</p>
              <Button variant="outline" size="sm" onClick={() => { void appointmentsQuery.refetch(); }}>
                Reintentar
              </Button>
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={Icons.tooth}
              message="Sin citas programadas para hoy"
              description="El sillón está libre para nuevas reservas o urgencias"
              action={
                can("dentistry:appointments:create") ? (
                  <Button variant="outline" size="sm" leftIcon={Icons.plus} onClick={() => setIsAppointmentOpen(true)}>
                    Agendar cita
                  </Button>
                ) : undefined
              }
              className="py-10"
            />
          ) : (
            <TodayAgendaList
              rows={rows}
              onOpen={(id) => router.push(`/agenda?citaId=${encodeURIComponent(id)}`)}
            />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <StatCard
          label="Citas de hoy"
          value={appointmentsQuery.isSuccess ? summary.total : "—"}
          sublabel={
            appointmentsQuery.isSuccess
              ? `${summary.completed} completadas · ${summary.inProgress} en sala o sillón`
              : undefined
          }
          icon={Icons.calendar}
          onClick={() => router.push("/agenda")}
        />
        <StatCard
          label="Pacientes activos"
          value={activePatientsQuery.isSuccess ? activePatientsQuery.data.pagination.totalItems : "—"}
          sublabel={activePatientsQuery.isError ? "No se pudo cargar" : "Registrados en la clínica"}
          icon={Icons.users}
          onClick={() => router.push("/patients")}
        />
      </div>

      <CreateAppointmentModal
        open={isAppointmentOpen}
        onClose={() => setIsAppointmentOpen(false)}
        onSuccess={() => setIsAppointmentOpen(false)}
      />
    </PageContainer>
  );
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <div role="toolbar" aria-label="Acciones rápidas" className="flex items-center gap-2">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          aria-label={action.label}
          title={action.label}
          className="relative inline-flex size-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-xs transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-subtle)]/30 hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 cursor-pointer"
        >
          <span aria-hidden="true" className="flex [&_svg]:size-5">{action.icon}</span>
          {action.creates && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--primary)] text-white [&_svg]:size-3"
            >
              {Icons.plus}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
