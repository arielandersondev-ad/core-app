"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  payments,
  getPatientById,
  formatCurrency,
  paymentMethodLabels,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import { StatCard, Button, Icons } from "@/shared/components/ui";
import { RegisterPaymentModal } from "@/modules/clinic/components";

export default function Payments({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState("2026-08-25");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentsList, setPaymentsList] = useState(payments);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  const filtered = paymentsList.filter((p) => {
    const inRange = p.date >= dateFrom && p.date <= dateTo;
    const matchMethod = methodFilter === "all" || p.method === methodFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return inRange && matchMethod && matchStatus;
  });

  const totalPaid = filtered
    .filter((p) => p.status === "pagado")
    .reduce((s, p) => s + p.amount, 0);
  const totalPending = filtered
    .filter((p) => p.status === "pendiente")
    .reduce((s, p) => s + p.amount, 0);

  const byMethod = ["efectivo", "tarjeta", "transferencia", "otro"].map(
    (m) => ({
      method: m,
      total: filtered
        .filter((p) => p.method === m && p.status === "pagado")
        .reduce((s, p) => s + p.amount, 0),
      count: filtered.filter((p) => p.method === m).length,
    }),
  );

  const paidCount = filtered.filter((p) => p.status === "pagado").length;
  const avgTicket = paidCount > 0 ? totalPaid / paidCount : 0;

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Control de Pagos y Caja"
        description="Registro de transacciones, cobros realizados y saldos pendientes"
        action={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Registrar pago
          </Button>
        }
      />

      {/* 2. KPIs y Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Cobrado"
          value={formatCurrency(totalPaid)}
          sublabel="En el período seleccionado"
          variant="accent"
          icon={Icons.dollarSign}
        />
        <StatCard
          label="Saldo Pendiente"
          value={formatCurrency(totalPending)}
          sublabel="Por regularizar"
          variant={totalPending > 0 ? "danger" : "default"}
          icon={Icons.alertTriangle}
        />
        <StatCard
          label="Transacciones"
          value={filtered.length}
          sublabel="Movimientos registrados"
          icon={Icons.branch}
        />
        <StatCard
          label="Ticket Promedio"
          value={avgTicket > 0 ? formatCurrency(avgTicket) : "—"}
          sublabel="Por pago completado"
        />
      </div>

      {/* 3. Filtros y Búsqueda */}
      <FilterToolbar>
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">
              Desde
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">
              Hasta
            </span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">Todos los métodos</option>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
          >
            <option value="all">Todos los estados</option>
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>
      </FilterToolbar>

      {/* 4. Tabla y Desglose */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tabla (desktop) */}
        <div className="lg:col-span-3 hidden md:block">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                  {[
                    "Fecha",
                    "Paciente",
                    "Concepto",
                    "Monto",
                    "Método",
                    "Estado",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((pay) => {
                    const patient = getPatientById(pay.patientId);
                    return (
                      <tr
                        key={pay.id}
                        className="hover:bg-[var(--background)]/60 cursor-pointer transition-colors"
                        onClick={() =>
                          onNavigate("paciente-detalle", {
                            patientId: pay.patientId,
                          })
                        }
                      >
                        <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)] whitespace-nowrap">
                          {new Date(pay.date).toLocaleDateString("es-PE", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-display font-semibold text-[var(--foreground)]">
                          {patient?.name.split(" ").slice(0, 2).join(" ")}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                          {pay.concept}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--foreground)]">
                          {formatCurrency(pay.amount)}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)]">
                          {paymentMethodLabels[pay.method]}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${
                              pay.status === "pagado"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : pay.status === "pendiente"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            }`}
                          >
                            {pay.status === "pagado"
                              ? "Pagado"
                              : pay.status === "pendiente"
                                ? "Pendiente"
                                : "Parcial"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                Sin pagos en el rango seleccionado
              </div>
            )}

            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]/30 flex items-center justify-between text-xs font-mono text-[var(--muted)]">
              <span>{filtered.length} transacciones</span>
              <span>
                Total cobrado: <strong>{formatCurrency(totalPaid)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tarjetas (móvil) */}
        <div className="md:hidden flex flex-col gap-3">
          {filtered
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((pay) => {
              const patient = getPatientById(pay.patientId);
              return (
                <div
                  key={pay.id}
                  onClick={() =>
                    onNavigate("paciente-detalle", { patientId: pay.patientId })
                  }
                  className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:bg-[var(--background)]/60 transition-colors shadow-xs"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-xs font-mono text-[var(--muted)]">
                        {new Date(pay.date).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="font-display font-semibold text-[var(--foreground)]">
                        {patient?.name.split(" ").slice(0, 2).join(" ") ||
                          "N/A"}
                      </p>
                    </div>
                    <span className="text-lg font-display font-bold text-[var(--foreground)]">
                      {formatCurrency(pay.amount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[var(--muted)]">
                      {pay.concept || "Sin concepto"}
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span className="text-[var(--muted)]">
                      {paymentMethodLabels[pay.method]}
                    </span>
                    <span className="text-[var(--muted)]">·</span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${
                        pay.status === "pagado"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : pay.status === "pendiente"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {pay.status === "pagado"
                        ? "Pagado"
                        : pay.status === "pendiente"
                          ? "Pendiente"
                          : "Parcial"}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Sidebar: por método */}
        <div className="lg:col-span-1 flex flex-col gap-2.5">
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
            Por método de pago
          </p>
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs divide-y divide-[var(--border)]">
            {byMethod
              .filter((m) => m.count > 0)
              .map((m) => (
                <div key={m.method} className="px-4 py-3.5">
                  <p className="text-xs font-display font-semibold text-[var(--foreground)] capitalize">
                    {
                      paymentMethodLabels[
                        m.method as keyof typeof paymentMethodLabels
                      ]
                    }
                  </p>
                  <p className="text-lg font-display font-bold text-[var(--primary)] mt-0.5">
                    {formatCurrency(m.total)}
                  </p>
                  <p className="text-[11px] font-mono text-[var(--muted)]">
                    {m.count} transacciones
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <RegisterPaymentModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setPaymentsList([...payments]);
        }}
      />
    </PageContainer>
  );
}
