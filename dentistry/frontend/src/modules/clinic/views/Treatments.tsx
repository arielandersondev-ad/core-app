import { useState } from "react";
import { services, formatCurrency } from "@/shared/data/clinic-data";

export default function Treatments({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = services.filter((s) => {
    const matchActive = showInactive ? true : s.active;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase());
    return matchActive && matchSearch;
  });

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total servicios", value: services.length },
          { label: "Activos", value: services.filter((s) => s.active).length },
          { label: "Categorías", value: categories.length },
          { label: "Precio promedio", value: formatCurrency(services.filter((s) => s.active).reduce((sum, s) => sum + s.basePriceMinor, 0) / services.filter((s) => s.active).length) },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-4">
            <p className="text-2xl font-display font-bold text-[var(--foreground)]">{s.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar servicio…" className="w-full h-9 pl-9 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-[3px] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]" />
        </div>
        <label className="flex items-center gap-2 text-sm text-[var(--muted)] cursor-pointer select-none">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="rounded" />
          Mostrar inactivos
        </label>
        <button
          onClick={() => onNavigate("crear-servicio")}
          className="h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[3px] text-sm font-display font-semibold hover:opacity-90 ml-auto"
        >
          + Nuevo servicio
        </button>
      </div>

      {/* By category */}
      {categories.map((cat) => {
        const catServices = filtered.filter((s) => s.category === cat);
        if (catServices.length === 0) return null;
        return (
          <div key={cat}>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">{cat}</p>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                    {["Servicio", "Descripción", "Duración", "Precio base", "Estado"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {catServices.map((svc) => (
                    <tr key={svc.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] transition-colors cursor-pointer">
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-display font-semibold text-[var(--foreground)]">{svc.name}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-[var(--muted)] max-w-xs">{svc.description}</td>
                      <td className="px-4 py-3.5 text-sm font-mono text-[var(--foreground)]">{svc.durationMin} min</td>
                      <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--primary)]">{formatCurrency(svc.basePriceMinor)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${svc.active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"}`}>
                          {svc.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
