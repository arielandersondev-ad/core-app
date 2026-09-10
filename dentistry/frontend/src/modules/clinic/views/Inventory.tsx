import { useState } from "react";
import { inventory, inventoryStatus } from "@/modules/clinic/__mocks__/data";

const statusConfig = {
  ok:      { label: "OK",       color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  bajo:    { label: "Stock bajo",  color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
  critico: { label: "Crítico",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
};

export default function Inventory() {
  const [filter, setFilter] = useState<"all" | "ok" | "bajo" | "critico">("all");

  const filtered = inventory.filter((item) => {
    if (filter === "all") return true;
    return inventoryStatus(item) === filter;
  });

  const counts = {
    ok: inventory.filter((i) => inventoryStatus(i) === "ok").length,
    bajo: inventory.filter((i) => inventoryStatus(i) === "bajo").length,
    critico: inventory.filter((i) => inventoryStatus(i) === "critico").length,
  };

  const categories = [...new Set(inventory.map((i) => i.category))];

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total artículos", value: inventory.length, filter: "all" as const },
          { label: "Sin problemas", value: counts.ok, filter: "ok" as const },
          { label: "Stock bajo", value: counts.bajo, filter: "bajo" as const },
          { label: "Crítico", value: counts.critico, filter: "critico" as const },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.filter)}
            className={`p-4 rounded-[4px] border text-left transition-colors ${filter === s.filter ? "border-[var(--primary)] bg-[var(--primary-subtle)]" : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/30"}`}
          >
            <p className={`text-3xl font-display font-bold ${s.filter === "critico" && s.value > 0 ? "text-[var(--danger)]" : s.filter === "bajo" && s.value > 0 ? "text-amber-600" : filter === s.filter ? "text-[var(--primary)]" : "text-[var(--foreground)]"}`}>{s.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">{s.label}</p>
          </button>
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

      {/* Table by category */}
      {categories.map((cat) => {
        const items = filtered.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">{cat}</p>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                    {["Artículo", "Stock actual", "Stock mínimo", "Unidad", "Último reabasto", "Estado"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const st = inventoryStatus(item);
                    const pct = Math.min(item.stock / Math.max(item.minStock * 2, item.stock), 1);
                    return (
                      <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="text-sm font-display font-semibold text-[var(--foreground)]">{item.name}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-display font-bold ${st === "critico" ? "text-[var(--danger)]" : st === "bajo" ? "text-amber-600" : "text-[var(--foreground)]"}`}>
                              {item.stock}
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
                        <td className="px-4 py-3.5 text-sm text-[var(--muted)]">{item.unit}</td>
                        <td className="px-4 py-3.5 text-[11px] font-mono text-[var(--muted)]">{new Date(item.lastRefill).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${statusConfig[st].color}`}>
                            {statusConfig[st].label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
