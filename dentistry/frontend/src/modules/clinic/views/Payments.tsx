"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  payments,
  getPatientById,
  formatCurrency,
  paymentMethodLabels,
  TODAY_DATE,
  Payment,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import {
  StatCard,
  CompactStatSummary,
  CompactStatItem,
  Button,
  Icons,
  Badge,
  MobileFilterSheet,
  FilterTriggerButton,
  PullToRefresh,
} from "@/shared/components/ui";
import { RegisterPaymentModal } from "@/modules/clinic/components";

const PAGE_SIZE = 15;

export default function Payments({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [dateFrom, setDateFrom] = useState("2026-08-01");
  const [dateTo, setDateTo] = useState(TODAY_DATE);
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [paymentsList, setPaymentsList] = useState<Payment[]>(payments);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (methodFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (dateFrom !== "2026-08-01" || dateTo !== TODAY_DATE) count++;
    return count;
  }, [methodFilter, statusFilter, dateFrom, dateTo]);

  // Infinite scroll pagination state
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Filtered dataset
  const filtered = useMemo(() => {
    return paymentsList.filter((p) => {
      const inRange = p.date >= dateFrom && p.date <= dateTo;
      const matchMethod = methodFilter === "all" || p.method === methodFilter;
      const matchStatus = statusFilter === "all" || p.status === statusFilter;
      return inRange && matchMethod && matchStatus;
    });
  }, [paymentsList, dateFrom, dateTo, methodFilter, statusFilter]);

  // Sorted list (newest first)
  const sortedPayments = useMemo(() => {
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [filtered]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [dateFrom, dateTo, methodFilter, statusFilter]);

  // Sliced items for infinite scroll progressive accumulation
  const visiblePayments = useMemo(() => {
    return sortedPayments.slice(0, page * PAGE_SIZE);
  }, [sortedPayments, page]);

  const hasMore = visiblePayments.length < sortedPayments.length;

  // IntersectionObserver for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore]);

  const handleRefresh = useCallback(async () => {
    setPage(1);
    setPaymentsList([...payments]);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      },
      { rootMargin: "150px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore]);

  // Financial aggregates
  const totalPaid = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "pagado")
        .reduce((s, p) => s + p.amount, 0),
    [filtered],
  );

  const totalPending = useMemo(
    () =>
      filtered
        .filter((p) => p.status === "pendiente")
        .reduce((s, p) => s + p.amount, 0),
    [filtered],
  );

  const paidCount = useMemo(
    () => filtered.filter((p) => p.status === "pagado").length,
    [filtered],
  );

  const avgTicket = paidCount > 0 ? totalPaid / paidCount : 0;

  const byMethod = useMemo(
    () =>
      ["efectivo", "tarjeta", "transferencia", "otro"].map((m) => ({
        method: m,
        total: filtered
          .filter((p) => p.method === m && p.status === "pagado")
          .reduce((s, p) => s + p.amount, 0),
        count: filtered.filter((p) => p.method === m).length,
      })),
    [filtered],
  );

  // Compact metrics for mobile strip (< 1024px / lg:hidden)
  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: "totalPaid",
        label: "Cobrado",
        value: formatCurrency(totalPaid),
        variant: "accent",
        icon: Icons.dollarSign,
      },
      {
        id: "totalPending",
        label: "Pendiente",
        value: formatCurrency(totalPending),
        variant: totalPending > 0 ? "warning" : "default",
        icon: Icons.alertTriangle,
      },
      {
        id: "txCount",
        label: "Transacciones",
        value: filtered.length,
        icon: Icons.branch,
      },
      {
        id: "avgTicket",
        label: "Promedio",
        value: avgTicket > 0 ? formatCurrency(avgTicket) : "—",
      },
    ],
    [totalPaid, totalPending, filtered.length, avgTicket],
  );

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

      {/* 2. KPIs Bimodales */}
      {/* Móvil (< 1024px / lg:hidden): CompactStatSummary minimalista en franja horizontal */}
      <div className="lg:hidden">
        <CompactStatSummary
          items={compactMetrics}
          variant="pill"
          className="py-1"
        />
      </div>

      {/* Desktop (>= 1024px / hidden lg:grid): 4 StatCards tradicionales */}
      <div className="hidden lg:grid grid-cols-4 gap-3.5">
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
        {/* Desktop View (hidden md:flex): Toolbar horizontal completa */}
        <div className="hidden md:flex flex-wrap items-center gap-3 flex-1">
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

        {/* Mobile View (md:hidden): Barra compacta con indicador de fechas y FilterTriggerButton */}
        <div className="md:hidden flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] truncate">
            <span className="font-mono text-[11px]">
              {dateFrom} → {dateTo}
            </span>
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
        title="Filtros de Pagos"
        activeCount={activeFilterCount}
        onClear={() => {
          setDateFrom("2026-08-01");
          setDateTo(TODAY_DATE);
          setMethodFilter("all");
          setStatusFilter("all");
        }}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Método de pago
            </label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="all">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Estado del pago
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="all">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
            </select>
          </div>
        </div>
      </MobileFilterSheet>

      {/* 4. Tabla y Desglose */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Contenedor principal de lista / tabla */}
        <div className="lg:col-span-3">
          <PullToRefresh onRefresh={handleRefresh}>
            <div className="flex flex-col gap-4">
          {/* VISTA MÓVIL (< 768px / md:hidden): Tarjetas verticales <article> limpias */}
          <div className="md:hidden flex flex-col gap-3">
            {visiblePayments.map((pay) => {
              const patient = getPatientById(pay.patientId);
              return (
                <article
                  key={pay.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs flex flex-col gap-2.5 hover:border-[var(--primary)]/40 transition-colors"
                >
                  {/* Cabecera de tarjeta: Paciente y Estado */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-sm text-[var(--foreground)] truncate">
                        {patient?.name || "Sin paciente"}
                      </h3>
                      <p className="text-[11px] font-mono text-[var(--muted)]">
                        {new Date(pay.date).toLocaleDateString("es-PE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge
                      variant={
                        pay.status === "pagado"
                          ? "success"
                          : pay.status === "pendiente"
                            ? "warning"
                            : "primary"
                      }
                      size="sm"
                    >
                      {pay.status === "pagado"
                        ? "Pagado"
                        : pay.status === "pendiente"
                          ? "Pendiente"
                          : "Parcial"}
                    </Badge>
                  </div>

                  {/* Detalle y método */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted)] leading-relaxed">
                    <span>{pay.concept || "Cobro clínico general"}</span>
                    <span>·</span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)]">
                      {paymentMethodLabels[pay.method]}
                    </span>
                  </div>

                  {/* Fila inferior: Monto y Acción */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)]">
                    <span className="text-base font-display font-bold text-[var(--primary)]">
                      {formatCurrency(pay.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate("paciente-detalle", {
                          patientId: pay.patientId,
                        })
                      }
                      className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      Ver paciente →
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* VISTA DESKTOP (>= 768px / hidden md:block): Tabla tradicional completa */}
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
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
                  {visiblePayments.map((pay) => {
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
                        <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--foreground)] whitespace-nowrap">
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
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-[var(--muted)]">
                Sin pagos en el rango seleccionado
              </div>
            )}

            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]/30 flex items-center justify-between text-xs font-mono text-[var(--muted)]">
              <span>{filtered.length} transacciones registradas</span>
              <span>
                Total cobrado: <strong>{formatCurrency(totalPaid)}</strong>
              </span>
            </div>
          </div>

          {/* Centinela y Footer para Scroll Infinito */}
          <div
            ref={sentinelRef}
            className="py-3 flex flex-col items-center justify-center gap-2 min-h-[40px]"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
                <div className="w-4 h-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <span>Cargando más pagos…</span>
              </div>
            )}
            {!hasMore && visiblePayments.length > 0 && (
              <p className="text-[11px] font-mono text-[var(--muted)] opacity-60">
                Todos los pagos cargados ({visiblePayments.length} de {filtered.length})
              </p>
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>

        {/* Sidebar: por método de pago */}
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
