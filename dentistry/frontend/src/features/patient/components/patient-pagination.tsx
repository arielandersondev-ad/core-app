import { Fragment } from "react";
import { visiblePatientPages } from "@/features/patient/utils/patient-list";
import type { PaginationMetadata } from "@/shared/types/pagination";

export function PatientPagination({ pagination, disabled, onChange }: { pagination: PaginationMetadata; disabled: boolean; onChange: (page: number) => void }) {
  const { page, totalPages } = pagination;
  const pages = visiblePatientPages(page, totalPages);
  const buttonClass = "min-w-9 rounded-lg border border-border px-3 py-2 text-sm hover:bg-background disabled:opacity-40 disabled:cursor-not-allowed";
  return (
    <nav aria-label="Paginación de pacientes" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">Página {page} de {totalPages}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" className={buttonClass} disabled={disabled || page <= 1} onClick={() => onChange(Math.min(page - 1, totalPages))}>Anterior</button>
        {pages.map((number, index) => (
          <Fragment key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span className="px-1 text-muted" aria-hidden="true">…</span>}
            <button type="button" aria-label={`Página ${number}`} aria-current={number === page ? "page" : undefined} className={`${buttonClass} ${number === page ? "bg-primary-subtle text-primary font-semibold" : ""}`} disabled={disabled} onClick={() => onChange(number)}>{number}</button>
          </Fragment>
        ))}
        <button type="button" className={buttonClass} disabled={disabled || page >= totalPages} onClick={() => onChange(page + 1)}>Siguiente</button>
      </div>
    </nav>
  );
}
