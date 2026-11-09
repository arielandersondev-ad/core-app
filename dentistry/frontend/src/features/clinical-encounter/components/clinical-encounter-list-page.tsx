"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PatientContextBoundary } from "@/features/clinical-encounter/components/patient-context-boundary";
import { ClinicalEncounterStatusBadge } from "@/features/clinical-encounter/components/clinical-encounter-status-badge";
import { useClinicalEncounters } from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import type {
  ClinicalEncounter,
  ClinicalEncounterListFilters,
} from "@/features/clinical-encounter/types/clinical-encounter";
import {
  ALL_ENCOUNTER_STATUSES,
  buildListFilters,
  countRecordedProcedures,
  describeEncounterSubtitle,
  formatProcedureCount,
  hasActiveListFilters,
  truncateText,
  type EncounterStatusFilter,
} from "@/features/clinical-encounter/utils/encounter-filters";
import { formatDateOnly, formatTimeOnly } from "@/features/clinical-encounter/utils/dates";
import type { PatientDto } from "@/features/patient/types/patient";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import {
  Button,
  EmptyState,
  Icons,
  Input,
  MobileCardItem,
  ResponsiveTable,
  Select,
  type ResponsiveTableColumn,
} from "@/shared/components/ui";

const PRIMARY_LINK_CLASSES =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 font-display text-sm font-semibold text-[var(--primary-foreground)] shadow-2xs transition-all hover:bg-[var(--primary-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40";

const OUTLINE_LINK_CLASSES =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] px-3 font-display text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--neutral-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40";

const statusFilterOptions = [
  { value: ALL_ENCOUNTER_STATUSES, label: "Todas" },
  { value: "IN_PROGRESS", label: "En curso" },
  { value: "COMPLETED", label: "Completadas" },
  { value: "VOIDED", label: "Anuladas" },
];

export function ClinicalEncounterListPage({ patientId }: { patientId: string }) {
  return (
    <PatientContextBoundary patientId={patientId}>
      {(patient) => <ClinicalEncounterListContent patient={patient} />}
    </PatientContextBoundary>
  );
}

function ClinicalEncounterListContent({ patient }: { patient: PatientDto }) {
  const session = useAuthenticatedSession();
  const canRead = session.permissions.includes("dentistry:encounters:read");
  const canCreate = session.permissions.includes("dentistry:encounters:create");

  const [status, setStatus] = useState<EncounterStatusFilter>(ALL_ENCOUNTER_STATUSES);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const filters = useMemo(
    () => buildListFilters({ status, search: debouncedSearch }),
    [status, debouncedSearch],
  );
  const isFiltering = hasActiveListFilters({ status, search: debouncedSearch });
  const isSearchPending = searchInput !== debouncedSearch;

  const createHref = `/patients/${encodeURIComponent(patient.id)}/clinical-encounters/new`;

  return (
    <PageContainer>
      <PageHeader
        title="Atenciones clínicas"
        description={`Historial de atenciones clínicas de ${patient.fullName}.`}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patient.fullName, href: `/patients/${encodeURIComponent(patient.id)}` },
          { label: "Atenciones clínicas" },
        ]}
        action={
          canRead && canCreate ? (
            <Link href={createHref} className={PRIMARY_LINK_CLASSES}>
              <span className="shrink-0">{Icons.plus}</span>
              Nueva atención
            </Link>
          ) : undefined
        }
      />

      {canRead ? (
        <>
          <section
            aria-label="Filtros de atenciones clínicas"
            className="rounded-xl border border-border bg-surface p-3 shadow-2xs sm:p-4"
          >
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
              <Input
                id="clinical-encounter-search"
                label="Buscar"
                placeholder="Motivo, profesional, sucursal…"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                leftIcon={Icons.search}
                inputSize="sm"
              />
              <Select
                id="clinical-encounter-status"
                label="Estado"
                value={status}
                onChange={(event) => setStatus(event.target.value as EncounterStatusFilter)}
                options={statusFilterOptions}
                selectSize="sm"
              />
            </div>
            {isSearchPending && (
              <p aria-live="polite" className="mt-2 text-xs text-muted">
                Buscando…
              </p>
            )}
          </section>

          <EncounterListResults
            patientId={patient.id}
            filters={filters}
            isFiltering={isFiltering}
            createHref={createHref}
            canCreate={canRead && canCreate}
          />
        </>
      ) : (
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm font-semibold text-foreground">
            No tienes permiso para consultar las atenciones clínicas.
          </p>
          <p className="mt-1 text-xs text-muted">
            Solicita el permiso <code>dentistry:encounters:read</code> a un administrador.
          </p>
          <div className="mt-4">
            <Link
              href={`/patients/${encodeURIComponent(patient.id)}`}
              className="text-sm text-primary hover:underline"
            >
              Volver a la ficha del paciente
            </Link>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function EncounterListResults({
  patientId,
  filters,
  isFiltering,
  createHref,
  canCreate,
}: {
  patientId: string;
  filters: ClinicalEncounterListFilters;
  isFiltering: boolean;
  createHref: string;
  canCreate: boolean;
}) {
  const query = useClinicalEncounters(patientId, filters);

  if (query.isPending) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted"
      >
        Cargando atenciones clínicas…
      </p>
    );
  }

  if (query.isError) {
    return (
      <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
        <p className="mb-4 text-sm text-foreground">
          No se pudieron cargar las atenciones clínicas. Inténtalo nuevamente.
        </p>
        <Button variant="outline" onClick={() => { void query.refetch(); }}>
          Reintentar
        </Button>
      </div>
    );
  }

  const encounters = query.data;

  if (encounters.length === 0) {
    return (
      <EmptyState
        message={
          isFiltering
            ? "Sin resultados para los filtros aplicados"
            : "Este paciente aún no tiene atenciones clínicas"
        }
        description={
          isFiltering
            ? "Ajusta el estado o la búsqueda para ver otras atenciones."
            : "Registra la primera atención clínica para iniciar el historial del paciente."
        }
        action={
          !isFiltering && canCreate ? (
            <Link href={createHref} className={PRIMARY_LINK_CLASSES}>
              <span className="shrink-0">{Icons.plus}</span>
              Nueva atención
            </Link>
          ) : undefined
        }
      />
    );
  }

  const columns: ResponsiveTableColumn<ClinicalEncounter>[] = [
    {
      key: "startedAt",
      header: "Inicio",
      accessor: (encounter) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{formatDateOnly(encounter.startedAt)}</p>
          <p className="font-mono text-[11px] text-muted">{formatTimeOnly(encounter.startedAt)}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      accessor: (encounter) => <ClinicalEncounterStatusBadge status={encounter.status} />,
    },
    {
      key: "practitioner",
      header: "Profesional",
      accessor: (encounter) => (
        <span className="text-sm text-foreground">{encounter.practitionerName || "—"}</span>
      ),
    },
    {
      key: "branch",
      header: "Sucursal",
      accessor: (encounter) => (
        <span className="text-sm text-muted">{encounter.branchName || "—"}</span>
      ),
    },
    {
      key: "procedures",
      header: "Procedimientos",
      align: "center",
      accessor: (encounter) => (
        <span className="font-mono text-xs text-muted">
          {formatProcedureCount(countRecordedProcedures(encounter.procedures))}
        </span>
      ),
    },
    {
      key: "summary",
      header: "Motivo / resumen",
      className: "max-w-[16rem]",
      accessor: (encounter) => <EncounterSummary encounter={encounter} />,
    },
    {
      key: "actions",
      header: <span className="sr-only">Acciones</span>,
      align: "right",
      accessor: (encounter) => (
        <Link
          href={`/patients/${encodeURIComponent(patientId)}/clinical-encounters/${encodeURIComponent(encounter.id)}`}
          className={OUTLINE_LINK_CLASSES}
        >
          Ver detalle
          <span className="shrink-0">{Icons.chevronRight}</span>
        </Link>
      ),
    },
  ];

  return (
    <ResponsiveTable
      items={encounters}
      columns={columns}
      keyExtractor={(encounter) => encounter.id}
      caption="Atenciones clínicas del paciente"
      footer={
        <span>
          {encounters.length === 1 ? "1 atención" : `${encounters.length} atenciones`}
          {isFiltering ? " con los filtros aplicados" : " en el historial"}
        </span>
      }
      renderCard={(encounter) => (
        <MobileCardItem
          avatar={
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle font-mono text-[11px] font-semibold text-primary">
              {new Date(encounter.startedAt).getDate()}
            </span>
          }
          title={formatDateOnly(encounter.startedAt)}
          subtitle={truncateText(describeEncounterSubtitle(encounter), 90) || "Sin motivo registrado"}
          badge={<ClinicalEncounterStatusBadge status={encounter.status} />}
          fields={[
            { label: "Inicio", value: formatTimeOnly(encounter.startedAt), mono: true },
            {
              label: "Procedimientos",
              value: formatProcedureCount(countRecordedProcedures(encounter.procedures)),
            },
            { label: "Profesional", value: encounter.practitionerName || "—" },
            { label: "Sucursal", value: encounter.branchName || "—" },
          ]}
          actions={
            <Link
              href={`/patients/${encodeURIComponent(patientId)}/clinical-encounters/${encodeURIComponent(encounter.id)}`}
              className={OUTLINE_LINK_CLASSES}
            >
              Ver detalle
              <span className="shrink-0">{Icons.chevronRight}</span>
            </Link>
          }
        >
          {encounter.status === "VOIDED" && encounter.voidReason && (
            <p className="rounded-lg bg-danger-subtle px-3 py-2 text-xs text-danger">
              <span className="font-semibold">Motivo de anulación: </span>
              {encounter.voidReason}
            </p>
          )}
        </MobileCardItem>
      )}
    />
  );
}

function EncounterSummary({ encounter }: { encounter: ClinicalEncounter }) {
  const summary = describeEncounterSubtitle(encounter);

  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate text-sm text-foreground" title={summary || undefined}>
        {summary ? truncateText(summary, 90) : "Sin registrar"}
      </p>
      {encounter.status === "VOIDED" && encounter.voidReason && (
        <p className="truncate text-xs text-danger" title={encounter.voidReason}>
          Anulada: {encounter.voidReason}
        </p>
      )}
    </div>
  );
}
