import { useState } from "react";
import {
  inventory,
  inventoryMovements,
  inventoryStatus,
  lastRestockAt,
  stockFromMovements,
  professionals,
  getMovementsByItem,
  formatMovementDate,
  signedQuantity,
  type InventoryItem,
  type InventoryStatus,
} from "@/shared/data/clinic-data";

type InventoryRow = InventoryItem & {
  status: InventoryStatus;
  categoryLabel: string;
};

const statusConfig = {
  ok:      { label: "OK",       color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bajo:    { label: "Stock bajo",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  critico: { label: "Crítico",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

const movementConfig = {
  entrada: { label: "Entrada", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  salida:  { label: "Salida",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  ajuste:  { label: "Ajuste",  color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
};

const quickFilters: { label: string; value: InventoryStatus | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Sin problemas", value: "ok" },
  { label: "Stock bajo", value: "bajo" },
  { label: "Crítico", value: "critico" },
];

export default function Inventory() {
  const [filter, setFilter] = useState<InventoryStatus | "all">("all");
  const [selected, setSelected] = useState<InventoryRow | null>(null);

  const rows: InventoryRow[] = inventory.map((item) => ({
    ...item,
    status: inventoryStatus(item),
    categoryLabel: item.category,
  }));

  const visibleRows =
    filter === "all"
      ? rows
      : rows.filter((r) => r.status === filter);

  const counts = {
    ok: rows.filter((r) => r.status === "ok").length,
    bajo: rows.filter((r) => r.status === "bajo").length,
    critico: rows.filter((r) => r.status === "critico").length,
  };

  const totalMovements = inventoryMovements.length;
  const reconciliations = rows.filter(
    (r) => stockFromMovements(r.id) !== r.stock
  ).length;

  const selectedMovements = selected
    ? getMovementsByItem(selected.id)
    : [];

  const derivedRestock = selected
    ? lastRestockAt(selected.id)
    : undefined;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total artículos", value: inventory.length, tone: "text-[var(--foreground)]" },
          { label: "Sin problemas", value: counts.ok, tone: "text-emerald-600" },
          { label: "Stock bajo", value: counts.bajo, tone: "text-amber-600" },
          { label: "Crítico", value: counts.critico, tone: "text-[var(--danger)]" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-[4px] border border-[var(--border)] bg-[var(--surface)]"
          >
            <p className={`text-3xl font-display font-bold ${s.tone}`}>
              {s.value}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {(counts.critico > 0 || counts.bajo > 0) && (
        <div className={`p-4 rounded-[4px] border flex items-start gap-3 ${counts.critico > 0 ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"}`}>
          <span className={`text-lg flex-shrink-0 ${counts.critico > 0 ? "text-[var(--danger)]" : "text-amber-600"}`}>⚠</span>
          <div>
            <p className={`text-sm font-display font-bold ${counts.critico > 0 ? "text-[var(--danger)]" : "text-amber-700 dark:text-amber-400"}`}>
              {counts.critico > 0 ? `${counts.critico} artículo(s) en estado crítico` : `${counts.bajo} artículo(s) con stock bajo`}
            </p>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">Reponer antes de que afecte las operaciones clínicas.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Artículos */}
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">
            Artículos · {totalMovements} movimientos registrados
          </p>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            {/* Filtros rápidos por estado */}
            <div className="border-b border-[var(--border)] bg-[var(--background)]/40 px-4 py-3 flex flex-wrap gap-1.5">
              {quickFilters.map((f) => (
                <FilterChip
                  key={f.value}
                  label={f.label}
                  active={filter === f.value}
                  onClick={() => setFilter(f.value)}
                />
              ))}
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Artículo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Categoría</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Stock</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Mínimo</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Último reabasto</th>
                  <th className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-[var(--muted)]">
                      No hay artículos en este estado.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((item) => {
                  const st = item.status;
                  const pct = Math.min(
                    item.stock / Math.max(item.minStock * 2, item.stock),
                    1
                  );
                  const isSelected = selected?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(isSelected ? null : item)}
                      className={`border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors ${isSelected ? "bg-[var(--primary-subtle)]" : ""}`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-display font-semibold text-[var(--foreground)]">{item.name}</p>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] font-mono text-[var(--muted)]">{item.category}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-display font-bold ${st === "critico" ? "text-[var(--danger)]" : st === "bajo" ? "text-amber-600" : "text-[var(--foreground)]"}`}>
                            {item.stock} <span className="text-[10px] font-mono font-normal text-[var(--muted)]">{item.unit}</span>
                          </p>
                          <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${st === "critico" ? "bg-[var(--danger)]" : st === "bajo" ? "bg-amber-400" : "bg-emerald-500"}`}
                              style={{ width: `${pct * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-mono text-[var(--muted)]">{item.minStock}</td>
                      <td className="px-4 py-3.5 text-[11px] font-mono text-[var(--muted)] whitespace-nowrap">{formatMovementDate(item.lastRefill)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusConfig[st].color}`}>
                          {statusConfig[st].label}
                        </span>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[var(--muted)]">
            Haz clic en un artículo para ver su bitácora de movimientos. El
            último reabasto se mantiene denormalizado en el artículo para poder
            ordenar sin recorrer todos los movimientos.
          </p>
        </div>

        {/* Bitácora del artículo seleccionado */}
        <aside className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-5 flex flex-col gap-4 sticky top-6">
          {selected ? (
            <>
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">Bitácora de inventario</p>
                <h3 className="font-display text-lg font-bold text-[var(--foreground)] mt-1">{selected.name}</h3>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  {selected.category} · {selected.stock} {selected.unit} en stock
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="border border-[var(--border)] rounded-[2px] p-2.5">
                  <dt className="font-mono uppercase tracking-widest text-[var(--muted)] text-[9px]">Último reabasto</dt>
                  <dd className="font-mono text-[var(--foreground)] mt-1">{formatMovementDate(selected.lastRefill)}</dd>
                  {derivedRestock !== undefined && (
                    <dd
                      className={`text-[9px] font-mono mt-1 ${derivedRestock === selected.lastRefill ? "text-emerald-600" : "text-[var(--danger)]"}`}
                    >
                      {derivedRestock === selected.lastRefill
                        ? " coincide con la bitácora"
                        : ` bitácora dice ${formatMovementDate(derivedRestock)}`}
                    </dd>
                  )}
                </div>
                <div className="border border-[var(--border)] rounded-[2px] p-2.5">
                  <dt className="font-mono uppercase tracking-widest text-[var(--muted)] text-[9px]">Stock mínimo</dt>
                  <dd className="font-mono text-[var(--foreground)] mt-1">{selected.minStock} {selected.unit}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2">
                {selectedMovements.map((m) => (
                  <div key={m.id} className="border border-[var(--border)] rounded-[2px] p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono uppercase rounded-[2px] ${movementConfig[m.type].color}`}>
                        {movementConfig[m.type].label}
                      </span>
                      <span className={`text-sm font-display font-bold ${signedQuantity(m) > 0 ? "text-emerald-600" : m.type === "ajuste" ? "text-zinc-600 dark:text-zinc-400" : "text-amber-600"}`}>
                        {signedQuantity(m) > 0 ? `+${signedQuantity(m)}` : signedQuantity(m)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-snug">{m.reason}</p>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-[var(--muted)]">
                      {formatMovementDate(m.date)}
                      {m.professionalId && ` · ${professionals.find((p) => p.id === m.professionalId)?.name ?? ""}`}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-[11px] text-[var(--muted)]">
              Selecciona un artículo para ver sus entradas, salidas y ajustes.
            </p>
          )}
        </aside>
      </div>

      {reconciliations > 0 && (
        <div className="p-4 rounded-[4px] border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
          <p className="text-sm font-display font-bold text-amber-700 dark:text-amber-400">
            {reconciliations} artículo(s) no cuadran con sus movimientos
          </p>
          <p className="text-[11px] text-[var(--muted)] mt-0.5">
            El stock registrado difiere de la suma de entradas y salidas. Revisar
            antes del próximo reabasto.
          </p>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[2px] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
        active
          ? "bg-[var(--primary)] text-white"
          : "bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/40"
      }`}
    >
      {label}
    </button>
  );
}