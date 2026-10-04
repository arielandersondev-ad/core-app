"use client";

import { useEffect, useState } from "react";
import {
  createClinicalEncounter,
  fetchClinicalEncounters,
  isEncounterOpen,
  ClinicalEncounterDto,
  ClinicalEncounterStatus,
} from "@/modules/clinic/api/clinical-encounters";
import { getPatientById } from "@/shared/data/clinic-data";
import { Button, EmptyState } from "@/shared/components/ui";

const statusConfig: Record<ClinicalEncounterStatus, { label: string; className: string }> = {
  IN_PROGRESS: {
    label: "En curso",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  },
  COMPLETED: {
    label: "Completada",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-BO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function Consultations({
  organizationId,
  branchId,
  professionalMembershipId,
  actingMembershipId,
  patientId,
  onNavigate,
}: {
  organizationId: string;
  branchId?: string;
  professionalMembershipId?: string;
  actingMembershipId?: string;
  patientId?: string;
  onNavigate?: (view: string, params?: Record<string, string>) => void;
}) {
  const [encounters, setEncounters] = useState<ClinicalEncounterDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | ClinicalEncounterStatus
  >("all");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchClinicalEncounters({ organizationId, patientId });
        if (isMounted) setEncounters(data);
      } catch (err) {
        if (isMounted) {
          setLoadError((err as Error).message);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [organizationId, patientId]);

  const filtered = encounters.filter((e) => {
    if (statusFilter === "all") return true;
    return (isEncounterOpen(e) ? "IN_PROGRESS" : "COMPLETED") === statusFilter;
  });

  const openCount = encounters.filter(isEncounterOpen).length;
  const completedCount = encounters.length - openCount;

  // Registrar exige paciente, sucursal, profesional y quién registra: todos
  // UUID validados por el backend. Sin ese contexto no se ofrece la acción.
  const canCreate = Boolean(
    patientId && branchId && professionalMembershipId && actingMembershipId,
  );

  const handleCreate = async () => {
    if (!canCreate) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const created = await createClinicalEncounter({
        organizationId,
        branchId: branchId!,
        patientId: patientId!,
        professionalMembershipId: professionalMembershipId!,
        startedAt: new Date().toISOString(),
        createdByMembershipId: actingMembershipId!,
      });
      setEncounters((prev) => [created, ...prev]);
    } catch (err) {
      setCreateError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 text-sm text-[var(--muted)]">
        Cargando consultas...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col gap-4 md:gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {[
          { label: "Total consultas", value: encounters.length, filter: "all" as const },
          { label: "En curso", value: openCount, filter: "IN_PROGRESS" as const },
          { label: "Completadas", value: completedCount, filter: "COMPLETED" as const },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={`bg-[var(--surface)] border rounded-[4px] p-3 md:p-5 text-left transition-colors ${
              statusFilter === s.filter
                ? "border-[var(--primary)] bg-[var(--primary-subtle)]"
                : "border-[var(--border)] hover:border-[var(--primary)]/30"
            }`}
          >
            <p className="text-lg md:text-3xl font-display font-bold text-[var(--foreground)]">
              {s.value}
            </p>
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">
              {s.label}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-3 md:p-4 flex items-center gap-2 md:gap-3">
        <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">
          Estado
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-8 px-3 text-xs bg-[var(--background)] border border-[var(--border)] rounded-[3px] text-[var(--foreground)]"
        >
          <option value="all">Todos</option>
          <option value="IN_PROGRESS">En curso</option>
          <option value="COMPLETED">Completadas</option>
        </select>
        <Button
          onClick={handleCreate}
          disabled={isCreating || !canCreate}
          title={
            canCreate
              ? undefined
              : "Requiere contexto de paciente, sucursal y profesional"
          }
          className="ml-auto"
        >
          {isCreating ? "Registrando..." : "+ Nueva consulta"}
        </Button>
      </div>

      {createError && (
        <div className="p-3 rounded-[4px] border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {createError}
        </div>
      )}

      {loadError && (
        <div className="p-3 rounded-[4px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
          No se pudieron cargar las consultas: {loadError}
        </div>
      )}

      {filtered.length === 0 && !loadError ? (
        <EmptyState message="Sin consultas registradas" />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((encounter) => {
            const open = isEncounterOpen(encounter);
            const status = open ? "IN_PROGRESS" : "COMPLETED";
            const patient = getPatientById(encounter.patientId);

            return (
              <div
                key={encounter.id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === encounter.id ? null : encounter.id)
                  }
                  className="w-full text-left p-4 hover:bg-[var(--background)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-display font-bold text-[var(--foreground)] truncate">
                        {patient?.name ?? encounter.patientId}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--muted)] mt-0.5">
                        {formatDateTime(encounter.startedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] shrink-0 ${statusConfig[status].className}`}
                    >
                      {statusConfig[status].label}
                    </span>
                  </div>

                  {encounter.chiefComplaint && (
                    <p className="text-sm text-[var(--muted)] mt-2 line-clamp-1">
                      {encounter.chiefComplaint}
                    </p>
                  )}
                </button>

                {expandedId === encounter.id && (
                  <div className="border-t border-[var(--border)] p-4 flex flex-col gap-3">
                    {encounter.diagnosis && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                          Diagnóstico
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {encounter.diagnosis}
                        </p>
                      </div>
                    )}
                    {encounter.procedurePerformed && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                          Procedimiento
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {encounter.procedurePerformed}
                        </p>
                      </div>
                    )}
                    {encounter.evolution && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                          Evolución
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {encounter.evolution}
                        </p>
                      </div>
                    )}
                    {encounter.recommendations && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                          Recomendaciones
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {encounter.recommendations}
                        </p>
                      </div>
                    )}
                    {encounter.notes && (
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1">
                          Notas
                        </p>
                        <p className="text-sm text-[var(--foreground)]">
                          {encounter.notes}
                        </p>
                      </div>
                    )}

                    {open && onNavigate && (
                      <button
                        onClick={() =>
                          onNavigate("consulta-editar", { encounterId: encounter.id })
                        }
                        className="self-start text-xs font-mono text-[var(--primary)] hover:underline"
                      >
                        Continuar consulta
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}