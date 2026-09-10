import { useState } from "react";
import { useRouter } from 'next/navigation';
import { payments, getPatientById, getServiceById, formatCurrency, paymentMethodLabels } from "@/modules/clinic/__mocks__/data";

export default function Payments({ onNavigate }: { onNavigate: (s: string, p?: Record<string, string>) => void }) {
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-25");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const router = useRouter();

  const filtered = payments.filter((p) => {
    const inRange = p.date >= dateFrom && p.date <= dateTo;
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return inRange && matchMethod && matchStatus;
  });

  const totalPaid = filtered.filter((p) => p.status === "pagado").reduce((s, p) => s + p.amount, 0);
  const totalPending = filtered.filter((p) => p.status === "pendiente").reduce((s, p) => s + p.amount, 0);
  const totalPartial = filtered.filter((p) => p.status === "parcial").reduce((s, p) => s + p.amount, 0);

  const byMethod = ["efectivo", "tarjeta", "transferencia", "otro"].map((m) => ({
    method: m,
    total: filtered.filter((p) => p.method === m && p.status === "pagado").reduce((s, p) => s + p.amount, 0),
    count: filtered.filter((p) => p.method === m).length,
  }));

  return (
    <div className="p-4 md:p-8 flex flex-col gap-4 md:gap-6">
      {/* Summary cards - responsive grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {[
          { label: "Total cobrado", value: formatCurrency(totalPaid), color: "text-[var(--primary)]" },
          { label: "Pendiente", value: formatCurrency(totalPending), color: totalPending > 0 ? "text-[var(--danger)]" : "text-[var(--foreground)]" },
          { label: "Transacciones", value: filtered.length, color: "text-[var(--foreground)]" },
          { label: "Ticket promedio", value: filtered.length > 0 ? formatCurrency(totalPaid / filtered.filter((p) => p.status === "pagado").length || 0) : "—", color: "text-[var(--foreground)]" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-3 md:p-5">
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-1 md:mb-2">{s.label}</p>
            <p className={`text-lg md:text-3xl font-display font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters - responsive */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">Desde</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 px-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-[3px] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] flex-1 min-w-[100px]" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">Hasta</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 px-2 text-xs bg-[var(--background)] border border-[var(--border)] rounded-[3px] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] flex-1 min-w-[100px]" />
        </div>
        <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)} className="h-8 px-3 text-xs bg-[var(--background)] border border-[var(--border)] rounded-[3px] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] flex-1 min-w-[80px]">
          <option value="all">Métodos</option>
          <option value="efectivo">Efectivo</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
          <option value="otro">Otro</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-8 px-3 text-xs bg-[var(--background)] border border-[var(--border)] rounded-[3px] text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] flex-1 min-w-[80px]">
          <option value="all">Estados</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
          <option value="parcial">Parcial</option>
        </select>
        <button
          onClick={() => router.push('/register-payment')}
          className="h-8 px-4 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[3px] text-xs font-semibold hover:opacity-90 w-full md:w-auto flex-shrink-0"
        >
          + Registrar pago
        </button>
      </div>

      {/* Table / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tabla (desktop) */}
        <div className="col-span-3 hidden md:block">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/40">
                  {["Fecha", "Paciente", "Concepto", "Monto", "Método", "Estado"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((pay) => {
                  const patient = getPatientById(pay.patientId);
                  return (
                    <tr key={pay.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)] cursor-pointer transition-colors" onClick={() => onNavigate("paciente-detalle", { patientId: pay.patientId })}>
                      <td className="px-4 py-3 text-xs font-mono text-[var(--muted)] whitespace-nowrap">{new Date(pay.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="px-4 py-3 text-sm font-display font-semibold text-[var(--foreground)]">{patient?.name.split(" ").slice(0, 2).join(" ")}</td>
                      <td className="px-4 py-3 text-sm text-[var(--muted)]">{pay.concept}</td>
                      <td className="px-4 py-3 text-sm font-display font-bold text-[var(--foreground)]">{formatCurrency(pay.amount)}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-[var(--muted)]">{paymentMethodLabels[pay.method]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${pay.status === "pagado" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : pay.status === "pendiente" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-blue-100 text-blue-700"}`}>
                          {pay.status === "pagado" ? "Pagado" : pay.status === "pendiente" ? "Pendiente" : "Parcial"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="py-12 text-center text-sm text-[var(--muted)]">Sin pagos en el rango seleccionado</div>}
            <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--background)]/30">
              <p className="text-[11px] font-mono text-[var(--muted)]">{filtered.length} transacciones · Total cobrado: <strong>{formatCurrency(totalPaid)}</strong></p>
            </div>
          </div>
        </div>

        {/* Tarjetas (móvil) */}
        <div className="md:hidden col-span-3 flex flex-col gap-3">
          {filtered.sort((a, b) => b.date.localeCompare(a.date)).map((pay) => {
            const patient = getPatientById(pay.patientId);
            return (
              <div key={pay.id} onClick={() => onNavigate("paciente-detalle", { patientId: pay.patientId })} className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] p-4 cursor-pointer hover:bg-[var(--background)] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs font-mono text-[var(--muted)]">{new Date(pay.date).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    <p className="font-display font-semibold text-[var(--foreground)]">{patient?.name.split(" ").slice(0, 2).join(" ") || "N/A"}</p>
                  </div>
                  <span className="text-lg font-display font-bold text-[var(--foreground)]">{formatCurrency(pay.amount)}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-[var(--muted)]">{pay.concept || "Sin concepto"}</span>
                  <span className="text-[var(--muted)]">·</span>
                  <span className="text-[var(--muted)]">{paymentMethodLabels[pay.method]}</span>
                  <span className="text-[var(--muted)]">·</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-[2px] ${pay.status === "pagado" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : pay.status === "pendiente" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-blue-100 text-blue-700"}`}>
                    {pay.status === "pagado" ? "Pagado" : pay.status === "pendiente" ? "Pendiente" : "Parcial"}
                  </span>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="py-12 text-center text-sm text-[var(--muted)]">Sin pagos en el rango seleccionado</div>}
        </div>

        {/* Sidebar: por método (visible en desktop y en móvil como footer) */}
        <div className="col-span-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--muted)] mb-2">Por método de pago</p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[4px] overflow-hidden">
            {byMethod.filter((m) => m.count > 0).map((m, i, arr) => (
              <div key={m.method} className={`px-4 py-3.5 ${i < arr.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                <p className="text-xs font-display font-semibold text-[var(--foreground)] capitalize">{paymentMethodLabels[m.method as keyof typeof paymentMethodLabels]}</p>
                <p className="text-lg font-display font-bold text-[var(--primary)] mt-0.5">{formatCurrency(m.total)}</p>
                <p className="text-[10px] font-mono text-[var(--muted)]">{m.count} transacciones</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}