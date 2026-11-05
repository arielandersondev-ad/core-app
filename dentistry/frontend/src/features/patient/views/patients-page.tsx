"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  PageContainer,
  PageHeader,
  FilterToolbar,
} from "@/shared/components/layout";
import {
  Input,
  Icons,
  Button,
  StatCard,
  CompactStatSummary,
  CompactStatItem,
  MobileFloatingActionMenu,
  MobileFilterSheet,
  FilterTriggerButton,
  PullToRefresh,
} from "@/shared/components/ui";
import { PatientTable } from "@/features/patient/components/patient-table";
import { PatientListError } from "@/features/patient/components/patient-list-error";
import { PatientPagination } from "@/features/patient/components/patient-pagination";
import { usePatients } from "@/features/patient/hooks/use-patients";
import { useDebouncedSearch } from "@/features/patient/hooks/use-debounced-search";
import {
  PATIENT_PAGE_SIZES,
  readPatientListParams,
  updatePatientListParams,
} from "@/features/patient/utils/patient-list";
import type {
  PatientDto,
  PatientStatus,
} from "@/features/patient/types/patient";
import { CreatePatientButton } from "@/features/patient/components/create-patient-button";

export default function PatientsPage() {
  const [createdMessage, setCreatedMessage] = useState("");
  const [isCreatePatientOpen, setIsCreatePatientOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = readPatientListParams(searchParams);
  const search = useDebouncedSearch(params.search ?? "");
  const isDebouncing = search !== (params.search ?? "");
  const query = usePatients(
    { ...params, search: search || undefined },
    !isDebouncing,
  );
  const isLoading = isDebouncing || query.isPending;
  const result = !isDebouncing && !query.isError ? query.data : undefined;
  const pagination = result?.pagination;
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  // Progressive infinite scroll accumulated patients
  const [accumulatedPatients, setAccumulatedPatients] = useState<PatientDto[]>(
    [],
  );
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  function changeParams(
    change: Parameters<typeof updatePatientListParams>[1],
    addHistory = false,
  ) {
    const next = updatePatientListParams(searchParams.toString(), change);
    const href = `${pathname}${next.size ? `?${next.toString()}` : ""}`;
    if (addHistory) window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  const handleRefresh = async () => {
    changeParams({ page: 1 });
    await query.refetch();
  };

  // Reset accumulated patients on search or status change
  useEffect(() => {
    setAccumulatedPatients([]);
  }, [params.search, params.status]);

  // Accumulate patients when data arrives
  useEffect(() => {
    if (!result?.items) return;
    if (params.page === 1) {
      setAccumulatedPatients(result.items);
    } else {
      setAccumulatedPatients((prev) => {
        const ids = new Set(prev.map((p) => p.id));
        const newItems = result.items.filter((p) => !ids.has(p.id));
        return [...prev, ...newItems];
      });
    }
  }, [result?.items, params.page]);

  // IntersectionObserver for Infinite Scroll (progressive loading)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          pagination &&
          params.page < pagination.totalPages &&
          !isLoading &&
          !query.isFetching
        ) {
          changeParams({ page: params.page + 1 });
        }
      },
      { rootMargin: "150px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pagination, params.page, isLoading, query.isFetching]);

  // Metrics computation for KPIs
  const totalPatients = pagination?.totalItems ?? 0;
  const currentItems =
    accumulatedPatients.length > 0
      ? accumulatedPatients
      : (result?.items ?? []);
  const activePatients = useMemo(() => {
    if (params.status === "ACTIVE") return totalPatients;
    if (params.status === "INACTIVE") return 0;
    return currentItems.filter((p) => p.status === "ACTIVE").length;
  }, [params.status, totalPatients, currentItems]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    return currentItems.filter((p) => p.createdAt?.startsWith(currentMonth))
      .length;
  }, [currentItems]);

  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: "total",
        label: "Total Pacientes",
        value: totalPatients,
        icon: Icons.users,
      },
      {
        id: "active",
        label: "Activos",
        value: activePatients,
        variant: "success",
        icon: Icons.check,
      },
      {
        id: "newThisMonth",
        label: "Nuevos / Mes",
        value: newThisMonth,
        variant: "accent",
        icon: Icons.plus,
      },
    ],
    [totalPatients, activePatients, newThisMonth],
  );

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (params.status) count++;
    if (params.pageSize && params.pageSize !== 10) count++;
    return count;
  }, [params.status, params.pageSize]);

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Pacientes"
        description="Consulta y búsqueda de pacientes de tu organización"
        action={
          <CreatePatientButton
            open={isCreatePatientOpen}
            onOpenChange={setIsCreatePatientOpen}
            onCreated={(patient) => {
              setCreatedMessage(
                `${patient.fullName} se registró correctamente.`,
              );
              changeParams({ page: 1 });
            }}
          />
        }
      />

      {/* 2. KPIs Bimodales */}
      {/* Móvil (< 1024px / lg:hidden): CompactStatSummary minimalista en franja horizontal */}
      <div className="lg:hidden">
        <CompactStatSummary
          items={compactMetrics}
          variant="pill"
          className="py-1"
        />
      </div>

      {/* Desktop (>= 1024px / hidden lg:grid): StatCards tradicionales completos */}
      <div className="hidden lg:grid grid-cols-3 gap-3.5">
        <StatCard
          label="Total Pacientes"
          value={totalPatients}
          sublabel="Expedientes clínicos"
          icon={Icons.users}
        />
        <StatCard
          label="Pacientes Activos"
          value={activePatients}
          sublabel="Con atención vigente"
          variant="success"
          icon={Icons.check}
        />
        <StatCard
          label="Nuevos este Mes"
          value={newThisMonth}
          sublabel="Ingresos recientes"
          variant="accent"
          icon={Icons.plus}
        />
      </div>

      {createdMessage && (
        <p
          role="status"
          className="rounded-lg bg-success-subtle px-4 py-3 text-sm text-success"
        >
          {createdMessage}
        </p>
      )}

      {/* 3. Filtros y Búsqueda */}
      <FilterToolbar>
        {/* Desktop View (hidden md:flex): Toolbar horizontal completa */}
        <div className="hidden md:flex items-center gap-3 w-full">
          <div className="relative flex-1 max-w-md">
            <Input
              aria-label="Buscar pacientes"
              inputSize="sm"
              leftIcon={Icons.search}
              className="pl-9!"
              placeholder="Nombre, teléfono, correo o documento…"
              value={searchParams.get("search") ?? ""}
              onChange={(event) => changeParams({ search: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted">
            Estado
            <select
              aria-label="Estado del paciente"
              value={params.status ?? ""}
              onChange={(event) =>
                changeParams({ status: event.target.value as PatientStatus | "" })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            Por página
            <select
              aria-label="Pacientes por página"
              value={params.pageSize}
              onChange={(event) =>
                changeParams({ pageSize: Number(event.target.value) })
              }
              className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              {!PATIENT_PAGE_SIZES.some((size) => size === params.pageSize) && (
                <option value={params.pageSize}>{params.pageSize}</option>
              )}
              {PATIENT_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Mobile View (md:hidden): Barra compacta en una sola fila (Input flex-1 + FilterTriggerButton) */}
        <div className="md:hidden flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Input
              aria-label="Buscar pacientes"
              inputSize="sm"
              leftIcon={Icons.search}
              className="pl-9!"
              placeholder="Buscar pacientes…"
              value={searchParams.get("search") ?? ""}
              onChange={(event) => changeParams({ search: event.target.value })}
            />
          </div>
          <FilterTriggerButton
            onClick={() => setIsFilterSheetOpen(true)}
            activeCount={activeFilterCount}
          />
        </div>
      </FilterToolbar>

      {/* Mobile Filter Sheet */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtros de Pacientes"
        activeCount={activeFilterCount}
        onClear={() => {
          changeParams({ status: "", pageSize: 10 });
        }}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Estado del paciente
            </label>
            <select
              aria-label="Estado del paciente móvil"
              value={params.status ?? ""}
              onChange={(event) =>
                changeParams({ status: event.target.value as PatientStatus | "" })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Solo Activos</option>
              <option value="INACTIVE">Solo Inactivos</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Pacientes por página
            </label>
            <select
              aria-label="Pacientes por página móvil"
              value={params.pageSize}
              onChange={(event) =>
                changeParams({ pageSize: Number(event.target.value) })
              }
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
            >
              {PATIENT_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} por página
                </option>
              ))}
            </select>
          </div>
        </div>
      </MobileFilterSheet>

      {/* 4. Listado Bimodal & Scroll Infinito */}
      <PullToRefresh onRefresh={handleRefresh}>
        <section
          aria-label="Resultados de pacientes"
          aria-busy={isLoading || query.isFetching}
          className="space-y-4"
      >
        {query.fetchStatus === "paused" ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted"
          >
            Sin conexión. La consulta continuará cuando recuperes la conexión.
          </p>
        ) : query.isError && !isDebouncing ? (
          <PatientListError
            error={query.error}
            loginHref={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            onRetry={() => {
              void query.refetch();
            }}
          />
        ) : isLoading && currentItems.length === 0 ? (
          <p
            role="status"
            className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted"
          >
            Cargando pacientes…
          </p>
        ) : (
          result && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <p aria-live="polite">
                  {currentItems.length > 0
                    ? `Mostrando ${currentItems.length} de ${result.pagination.totalItems} pacientes`
                    : `0 de ${result.pagination.totalItems} pacientes`}
                </p>
                {query.isFetching ? (
                  <p role="status">Actualizando…</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      void query.refetch();
                    }}
                    className="text-primary hover:underline"
                  >
                    Actualizar
                  </button>
                )}
              </div>

              {currentItems.length ? (
                <PatientTable patients={currentItems} />
              ) : (
                <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
                  <p className="text-sm text-muted">
                    {result.pagination.totalItems > 0
                      ? "Esta página no contiene pacientes."
                      : params.search || params.status
                        ? "No hay pacientes que coincidan con los filtros."
                        : "Todavía no hay pacientes registrados."}
                  </p>
                  {params.page > 1 && (
                    <button
                      type="button"
                      onClick={() => changeParams({ page: 1 }, true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Volver a la primera página
                    </button>
                  )}
                  {(params.search || params.status) && (
                    <button
                      type="button"
                      onClick={() => changeParams({ search: "", status: "" })}
                      className="block mx-auto text-sm text-primary hover:underline"
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}

              {/* Centinela inferior para carga progresiva de scroll infinito */}
              <div
                ref={sentinelRef}
                className="py-2 flex flex-col items-center justify-center gap-2 min-h-[40px]"
              >
                {query.isFetching && params.page > 1 && (
                  <div className="flex items-center gap-2 text-xs font-mono text-muted">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Cargando más pacientes…</span>
                  </div>
                )}
                {pagination &&
                  params.page >= pagination.totalPages &&
                  currentItems.length > 0 && (
                    <p className="text-[11px] font-mono text-muted opacity-60">
                      Todos los pacientes cargados ({currentItems.length} total)
                    </p>
                  )}
              </div>

              {/* Paginación desktop complementaria */}
              {pagination && pagination.totalPages > 1 && (
                <div className="hidden md:block">
                  <PatientPagination
                    pagination={pagination}
                    disabled={query.isFetching}
                    onChange={(page) => changeParams({ page }, true)}
                  />
                </div>
              )}
            </>
          )
        )}
        </section>
      </PullToRefresh>

      {/* 5. Menú Flotante de Acciones Rápidas Móvil (Speed-Dial FAB) */}
      <MobileFloatingActionMenu
        ariaLabel="Acciones rápidas de pacientes"
        className="md:hidden"
        actions={[
          {
            label: "Nuevo Paciente",
            icon: Icons.users,
            variant: "primary",
            onClick: () => setIsCreatePatientOpen(true),
          },
        ]}
      />
    </PageContainer>
  );
}
