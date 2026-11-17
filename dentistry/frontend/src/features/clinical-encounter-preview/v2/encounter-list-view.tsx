"use client";

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Combobox,
  EmptyState,
  Icons,
  Input,
  MobileCardItem,
  ResponsiveTable,
  Select,
  type ResponsiveTableColumn,
} from "@/shared/components/ui";
import { FilterToolbar } from "@/shared/components/layout";
import { PageHeader } from "./page-header";
import type { ClinicalEncounter, HealthProfile, Patient } from "../types";
import { computeAge, formatDateOnly, formatDateTimeShort, statusLabels } from "./demo-store";
import { DemoTags, Panel, StatusBadge } from "./demo-ui";
import styles from "./demo.module.css";

function initials(fullName: string) {
  return fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "primary" | "warning" | "success" }) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "warning"
        ? "text-warning"
        : tone === "success"
          ? "text-success"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-2xs">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

export function EncounterListView({
  patient,
  healthProfile,
  encounters,
  professionals,
  onOpen,
  onCreate,
  onOpenHealth,
}: {
  patient: Patient;
  healthProfile: HealthProfile;
  encounters: ClinicalEncounter[];
  professionals: string[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onOpenHealth: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [professional, setProfessional] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return encounters.filter((encounter) => {
      if (status !== "ALL" && encounter.status !== status) return false;
      if (professional && encounter.professionalName !== professional) return false;
      if (!term) return true;
      return (
        encounter.examinationSummary.toLowerCase().includes(term) ||
        encounter.professionalName.toLowerCase().includes(term) ||
        encounter.branchName.toLowerCase().includes(term) ||
        (encounter.procedureSummary ?? "").toLowerCase().includes(term)
      );
    });
  }, [encounters, professional, query, status]);

  const stats = useMemo(
    () => ({
      total: encounters.length,
      inProgress: encounters.filter((item) => item.status === "IN_PROGRESS").length,
      completed: encounters.filter((item) => item.status === "COMPLETED").length,
    }),
    [encounters],
  );

  const columns: ResponsiveTableColumn<ClinicalEncounter>[] = [
    {
      key: "startedAt",
      header: "Inicio",
      accessor: (encounter) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{formatDateTimeShort(encounter.startedAt)}</p>
          <p className="font-mono text-[10px] text-muted">{formatDateOnly(encounter.startedAt)}</p>
        </div>
      ),
    },
    { key: "status", header: "Estado", accessor: (encounter) => <StatusBadge status={encounter.status} /> },
    { key: "professional", header: "Profesional", accessor: (encounter) => <span className="text-sm text-foreground">{encounter.professionalName}</span> },
    { key: "branch", header: "Sucursal", accessor: (encounter) => <span className="text-sm text-muted">{encounter.branchName}</span> },
    {
      key: "procedures",
      header: "Procedimientos",
      align: "center",
      accessor: (encounter) => (
        <span className="font-mono text-xs text-muted">{encounter.procedures.length}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      accessor: (encounter) => (
        <Button size="sm" variant="outline" onClick={() => onOpen(encounter.id)} rightIcon={Icons.chevronRight}>
          Ver
        </Button>
      ),
    },
  ];

  const hasAllergies = Boolean(healthProfile.allergies.trim());

  return (
    <>
      <PageHeader
        title="Atenciones clínicas"
        description={`Historial de atenciones de ${patient.fullName}. Registra lo realizado sin sustituir el plan de tratamiento.`}
        breadcrumbs={[{ label: "Pacientes" }, { label: patient.fullName }, { label: "Atenciones clínicas" }]}
        action={
          <Button variant="primary" leftIcon={Icons.plus} onClick={onCreate}>
            Nueva atención
          </Button>
        }
      />

      <section className="mt-1 rounded-xl border border-border bg-surface p-4 shadow-2xs sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-subtle font-display text-base font-bold text-primary">
            {initials(patient.fullName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-base font-semibold text-foreground">{patient.fullName}</h2>
              <Badge variant={patient.status === "ACTIVE" ? "active" : "inactive"}>{patient.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">Edad</dt>
                <dd className="text-sm text-foreground">{computeAge(patient.birthDate)} años</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">Sexo</dt>
                <dd className="text-sm text-foreground">{patient.sex}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">Teléfono</dt>
                <dd className="text-sm text-foreground">{patient.phone}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">Correo</dt>
                <dd className="truncate text-sm text-foreground">{patient.email}</dd>
              </div>
            </dl>
          </div>
          <Button variant="outline" size="sm" onClick={onOpenHealth} leftIcon={DemoTags.pulse}>
            Perfil de salud
          </Button>
        </div>

        {hasAllergies && (
          <div className={`mt-4 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-subtle px-3.5 py-3 text-danger ${styles.pulse}`}>
            <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide">Alergias registradas</p>
              <p className="mt-0.5 text-xs leading-relaxed">{healthProfile.allergies}</p>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={stats.total} tone="primary" />
        <StatCard label="En curso" value={stats.inProgress} tone="warning" />
        <StatCard label="Completadas" value={stats.completed} tone="success" />
      </div>

      <Panel id="ce-list-table" title="Historial" description={`${filtered.length} de ${encounters.length} atenciones`} bodyClassName="p-0 sm:p-0">
        <FilterToolbar className="rounded-none border-0 border-b border-border shadow-none">
          <div className="w-full sm:max-w-xs">
            <Input
              id="ce-list-search"
              placeholder="Buscar por exploración, profesional o sucursal…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              leftIcon={Icons.search}
            />
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <Select
              id="ce-list-status"
              aria-label="Filtrar por estado"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={[
                { value: "ALL", label: "Todos los estados" },
                { value: "IN_PROGRESS", label: statusLabels.IN_PROGRESS },
                { value: "COMPLETED", label: statusLabels.COMPLETED },
                { value: "VOIDED", label: statusLabels.VOIDED },
              ]}
            />
            <Combobox
              id="ce-list-professional"
              options={[{ value: "", label: "Todos los profesionales" }, ...professionals.map((name) => ({ value: name, label: name }))]}
              value={professional}
              onChange={setProfessional}
              selectSize="md"
              className="sm:w-56"
            />
          </div>
        </FilterToolbar>

        <ResponsiveTable
          items={filtered}
          columns={columns}
          keyExtractor={(encounter) => encounter.id}
          caption="Atenciones clínicas del paciente"
          className="p-3 sm:p-4"
          emptyState={
            <EmptyState
              message="Sin atenciones para mostrar"
              description="Ajusta los filtros o registra una nueva atención clínica."
              action={
                <Button variant="primary" leftIcon={Icons.plus} onClick={onCreate}>
                  Nueva atención
                </Button>
              }
            />
          }
          renderCard={(encounter, index) => (
            <MobileCardItem
              className={styles.rowIn}
              style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
              onClick={() => onOpen(encounter.id)}
              avatar={
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle font-mono text-[11px] font-semibold text-primary">
                  {new Date(encounter.startedAt).getDate()}
                </span>
              }
              title={formatDateOnly(encounter.startedAt)}
              subtitle={`${encounter.professionalName} · ${encounter.branchName}`}
              badge={<StatusBadge status={encounter.status} />}
              fields={[
                { label: "Inicio", value: formatDateTimeShort(encounter.startedAt), mono: true },
                { label: "Procedimientos", value: String(encounter.procedures.length) },
              ]}
              actions={
                <Button size="sm" variant="outline" rightIcon={Icons.chevronRight}>
                  Ver detalle
                </Button>
              }
            />
          )}
        />
      </Panel>
    </>
  );
}
