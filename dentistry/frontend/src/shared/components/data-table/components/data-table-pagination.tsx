interface Props {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function DataTablePagination({ currentPage, totalPages, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-elevated transition-colors"
      >
        Anterior
      </button>

      <button
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-border px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-elevated transition-colors"
      >
        Siguiente
      </button>
    </div>
  );
}