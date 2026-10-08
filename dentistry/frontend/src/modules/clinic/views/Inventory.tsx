"use client";

import { useState } from "react";
import { inventory, inventoryStatus } from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { StatCard, Button, Icons } from "@/shared/components/ui";
import { CreateInventoryModal } from "@/modules/clinic/components";

const statusConfig = {
  ok: {
    label: "OK",
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800",
  },
  bajo: {
    label: "Stock bajo",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800",
  },
  critico: {
    label: "Crítico",
    color:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800",
  },
};

export default function Inventory() {
  const [filter, setFilter] = useState<"all" | "ok" | "bajo" | "critico">(
    "all",
  );
  const [inventoryList, setInventoryList] = useState(inventory);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filtered = inventoryList.filter((item) => {
    if (filter === "all") return true;
    return inventoryStatus(item) === filter;
  });

  const counts = {
    ok: inventoryList.filter((i) => inventoryStatus(i) === "ok").length,
    bajo: inventoryList.filter((i) => inventoryStatus(i) === "bajo").length,
    critico: inventoryList.filter((i) => inventoryStatus(i) === "critico").length,
  };

  const categories = [...new Set(inventoryList.map((i) => i.category))];

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Inventario Clínico"
        description="Control de existencias de insumos odontológicos, instrumental y reposición de materiales"
        action={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nuevo insumo
          </Button>
        }
      />

      {/* 2. KPIs y Filtros Rápidos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Artículos"
          value={inventory.length}
          sublabel="En catálogo"
          icon={Icons.branch}
          onClick={() => setFilter("all")}
          active={filter === "all"}
        />
        <StatCard
          label="Stock Normal"
          value={counts.ok}
          sublabel="Niveles adecuados"
          variant="success"
          icon={Icons.check}
          onClick={() => setFilter("ok")}
          active={filter === "ok"}
        />
        <StatCard
          label="Stock Bajo"
          value={counts.bajo}
          sublabel="Próximos a reponer"
          variant="warning"
          icon={Icons.alertTriangle}
          onClick={() => setFilter("bajo")}
          active={filter === "bajo"}
        />
        <StatCard
          label="Crítico"
          value={counts.critico}
          sublabel="Atención urgente"
          variant="danger"
          icon={Icons.alertTriangle}
          onClick={() => setFilter("critico")}
          active={filter === "critico"}
        />
      </div>

      {/* 3. Banner de Alertas */}
      {(counts.critico > 0 || counts.bajo > 0) && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 shadow-xs ${
            counts.critico > 0
              ? "bg-red-50/70 border-red-200 dark:bg-red-950/20 dark:border-red-900"
              : "bg-amber-50/70 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
          }`}
        >
          <span
            className={`text-xl flex-shrink-0 ${
              counts.critico > 0 ? "text-[var(--danger)]" : "text-amber-600"
            }`}
          >
            ⚠
          </span>
          <div>
            <p
              className={`text-sm font-display font-bold ${
                counts.critico > 0
                  ? "text-[var(--danger)]"
                  : "text-amber-700 dark:text-amber-400"
              }`}
            >
              {counts.critico > 0
                ? `${counts.critico} artículo(s) en estado crítico de reposición`
                : `${counts.bajo} artículo(s) con stock por debajo del mínimo`}
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Coordina el reabasto con proveedores para evitar interrupciones en
              tratamientos clínicos.
            </p>
          </div>
        </div>
      )}

      {/* 4. Tablas por Categoría */}
      <div className="flex flex-col gap-6">
        {categories.map((cat) => {
          const items = filtered.filter((i) => i.category === cat);
          if (items.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                  {cat}
                </h2>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"}
                </span>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                        {[
                          "Artículo",
                          "Stock actual",
                          "Stock mínimo",
                          "Unidad",
                          "Último reabasto",
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
                      {items.map((item) => {
                        const st = inventoryStatus(item);
                        const pct = Math.min(
                          item.stock / Math.max(item.minStock * 2, item.stock),
                          1,
                        );

                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[var(--background)]/60 transition-colors"
                          >
                            <td className="px-4 py-3.5">
                              <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                                {item.name}
                              </p>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <p
                                  className={`text-sm font-display font-bold ${
                                    st === "critico"
                                      ? "text-[var(--danger)]"
                                      : st === "bajo"
                                        ? "text-amber-600"
                                        : "text-[var(--foreground)]"
                                  }`}
                                >
                                  {item.stock}
                                </p>
                                <div className="w-20 h-2 bg-[var(--border)]/60 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      st === "critico"
                                        ? "bg-[var(--danger)]"
                                        : st === "bajo"
                                          ? "bg-amber-400"
                                          : "bg-emerald-500"
                                    }`}
                                    style={{ width: `${pct * 100}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-sm font-mono text-[var(--muted)]">
                              {item.minStock}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-[var(--muted)]">
                              {item.unit}
                            </td>
                            <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)]">
                              {new Date(item.lastRefill).toLocaleDateString(
                                "es-PE",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${statusConfig[st].color}`}
                              >
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
            </div>
          );
        })}
      </div>

      <CreateInventoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setInventoryList([...inventory]);
        }}
      />
    </PageContainer>
  );
}
