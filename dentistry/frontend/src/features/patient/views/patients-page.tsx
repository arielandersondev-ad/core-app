"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import { Input, Icons, Button } from "@/shared/components/ui";
import { PatientTable } from "@/features/patient/components/patient-table";
import { PatientListError } from "@/features/patient/components/patient-list-error";
import { PatientPagination } from "@/features/patient/components/patient-pagination";
import { usePatients } from "@/features/patient/hooks/use-patients";
import { useDebouncedSearch } from "@/features/patient/hooks/use-debounced-search";
import { PATIENT_PAGE_SIZES, readPatientListParams, updatePatientListParams } from "@/features/patient/utils/patient-list";
import type { PatientStatus } from "@/features/patient/types/patient";
import { CreatePatientButton } from "@/features/patient/components/create-patient-button";

export default function PatientsPage() {
  const [createdMessage, setCreatedMessage] = useState("");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = readPatientListParams(searchParams);
  const search = useDebouncedSearch(params.search ?? "");
  const isDebouncing = search !== (params.search ?? "");
  const query = usePatients({ ...params, search: search || undefined }, !isDebouncing);
  const isLoading = isDebouncing || query.isPending;
  const result = !isDebouncing && !query.isError ? query.data : undefined;
  const pagination = result?.pagination;
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  function changeParams(change: Parameters<typeof updatePatientListParams>[1], addHistory = false) {
    const next = updatePatientListParams(searchParams.toString(), change);
    const href = `${pathname}${next.size ? `?${next.toString()}` : ""}`;
    if (addHistory) window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  return (
    <PageContainer>
      <PageHeader title="Pacientes" description="Consulta y búsqueda de pacientes de tu organización" action={
        <CreatePatientButton onCreated={(patient) => {
          setCreatedMessage(`${patient.fullName} se registró correctamente.`);
          changeParams({ page: 1 });
        }} />
      } />
      {createdMessage && <p role="status" className="rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">{createdMessage}</p>}
      <FilterToolbar>
        <div className="relative flex-1 max-w-md">
          <Input aria-label="Buscar pacientes" inputSize="sm" leftIcon={Icons.search} className="pl-9!" placeholder="Nombre, teléfono, correo o documento…" value={searchParams.get("search") ?? ""} onChange={(event) => changeParams({ search: event.target.value })} />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          Estado
          <select aria-label="Estado del paciente" value={params.status ?? ""} onChange={(event) => changeParams({ status: event.target.value as PatientStatus | "" })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">
            <option value="">Todos</option><option value="ACTIVE">Activos</option><option value="INACTIVE">Inactivos</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs text-muted">
          Por página
          <select aria-label="Pacientes por página" value={params.pageSize} onChange={(event) => changeParams({ pageSize: Number(event.target.value) })} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground">
            {!PATIENT_PAGE_SIZES.some((size) => size === params.pageSize) && <option value={params.pageSize}>{params.pageSize}</option>}
            {PATIENT_PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
      </FilterToolbar>

      <section aria-label="Resultados de pacientes" aria-busy={isLoading || query.isFetching} className="space-y-4">
        {query.fetchStatus === "paused" ? (
          <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Sin conexión. La consulta continuará cuando recuperes la conexión.</p>
        ) : query.isError && !isDebouncing ? (
          <PatientListError error={query.error} loginHref={`/login?returnTo=${encodeURIComponent(returnTo)}`} onRetry={() => { void query.refetch(); }} />
        ) : isLoading ? (
          <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Cargando pacientes…</p>
        ) : result && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <p aria-live="polite">{result.items.length > 0 ? `${(result.pagination.page - 1) * result.pagination.pageSize + 1}–${(result.pagination.page - 1) * result.pagination.pageSize + result.items.length} de ${result.pagination.totalItems} pacientes` : `0 de ${result.pagination.totalItems} pacientes`}</p>
              {query.isFetching ? <p role="status">Actualizando…</p> : <button type="button" onClick={() => { void query.refetch(); }} className="text-primary hover:underline">Actualizar</button>}
            </div>
            {result.items.length ? <PatientTable patients={result.items} /> : (
              <div className="rounded-xl border border-border bg-surface p-8 text-center space-y-3">
                <p className="text-sm text-muted">{result.pagination.totalItems > 0 ? "Esta página no contiene pacientes." : params.search || params.status ? "No hay pacientes que coincidan con los filtros." : "Todavía no hay pacientes registrados."}</p>
                {params.page > 1 && <button type="button" onClick={() => changeParams({ page: 1 }, true)} className="text-sm text-primary hover:underline">Volver a la primera página</button>}
                {(params.search || params.status) && <button type="button" onClick={() => changeParams({ search: "", status: "" })} className="block mx-auto text-sm text-primary hover:underline">Limpiar filtros</button>}
              </div>
            )}
            {pagination && pagination.totalPages > 0 && <PatientPagination pagination={pagination} disabled={query.isFetching} onChange={(page) => changeParams({ page }, true)} />}
          </>
        )}
      </section>
    </PageContainer>
  );
}
