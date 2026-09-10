import { useState } from "react";
import { patients, calcAge } from "@/modules/clinic/__mocks__/data";

export default function Patients({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.email.toLowerCase().includes(q);
  });

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total pacientes", value: patients.length },
          { label: "Con cita esta semana", value: 5 },
          { label: "Nuevos este mes", value: 2 },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-4">
            <p className="text-3xl font-display font-bold text-[var(--foreground)]">{s.value}</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o correo…"
            className="w-full h-9 pl-9 pr-3 bg-[var(--surface)] border border-[var(--border)] rounded-[3px] text-sm placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          />
        </div>
        <button
          onClick={() => onNavigate("crear-paciente")}
          className="h-9 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[3px] text-sm font-display font-semibold flex items-center gap-1.5 hover:opacity-90 ml-auto"
        >
          + Nuevo paciente
        </button>
      </div>

      {/* Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
              {["Paciente", "Edad · Sangre", "Teléfono", "Alergias", "Última visita", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => onNavigate("paciente-detalle", { patientId: p.id })}
                className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors group"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[var(--primary-subtle)] flex items-center justify-center text-[var(--primary)] text-xs font-display font-bold flex-shrink-0">
                      {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-display font-semibold text-[var(--foreground)]">{p.name}</p>
                      <p className="text-[11px] font-mono text-[var(--muted)]">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                  {calcAge(p.dob)} años · <span className="font-mono">{p.bloodType}</span>
                </td>
                <td className="px-4 py-3.5 text-sm font-mono text-[var(--foreground)]">{p.phone}</td>
                <td className="px-4 py-3.5">
                  {p.allergies.length === 0 ? (
                    <span className="text-[11px] text-[var(--muted)]">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.allergies.map((a) => (
                        <span key={a} className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide rounded-[2px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-[11px] font-mono text-[var(--muted)]">
                  {new Date(p.lastVisit).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3.5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-[var(--muted)]">Sin resultados para "{search}"</div>
        )}
        <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--background)]/30">
          <p className="text-[11px] font-mono text-[var(--muted)]">{filtered.length} de {patients.length} pacientes</p>
        </div>
      </div>
    </div>
  );
}
