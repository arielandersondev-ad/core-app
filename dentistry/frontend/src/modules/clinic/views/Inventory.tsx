"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  inventory as initialInventory,
  inventoryMovements,
  inventoryStatus,
  formatMovementDate,
  getMovementsByItem,
  getProfessionalById,
  signedQuantity,
  stockFromMovements,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from "@/modules/clinic/__mocks__/data";
import {
  useInventoryItems,
  useInventoryMutations,
  useInventoryMovements,
} from "@/features/inventory/hooks/use-inventory";
import type {
  InventoryItemDto,
  InventoryMovementDto,
} from "@/features/inventory/types/inventory";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import {
  StatCard,
  CompactStatSummary,
  CompactStatItem,
  Button,
  Icons,
  Input,
  Select,
  Badge,
  MobileFilterSheet,
  FilterTriggerButton,
  PullToRefresh,
  ResponsiveModal,
} from "@/shared/components/ui";
import {
  CreateInventoryModal,
  RegisterInventoryMovementModal,
} from "@/modules/clinic/components";

const PAGE_SIZE = 15;

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

const movementConfig: Record<
  InventoryMovementType,
  { label: string; color: string }
> = {
  IN: {
    label: "Entrada",
    color:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  OUT: {
    label: "Salida",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  },
  ADJUSTMENT: {
    label: "Ajuste",
    color:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

function fromApiItem(dto: InventoryItemDto): InventoryItem {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category ?? "Sin categoría",
    unit: dto.unit,
    stock: dto.currentStock,
    minStock: dto.minStock,
    lastRefill: dto.updatedAt.slice(0, 10),
  };
}

function fromApiMovement(dto: InventoryMovementDto): InventoryMovement {
  return {
    id: dto.id,
    itemId: dto.itemId,
    type: dto.type,
    quantity: dto.quantity,
    occurredAt: dto.createdAt.slice(0, 10),
    reason: dto.reason ?? "",
  };
}

export default function Inventory() {
  const [filter, setFilter] = useState<"all" | "ok" | "bajo" | "critico">("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [localInventory, setLocalInventory] =
    useState<InventoryItem[]>(initialInventory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] =
    useState(false);
  const [movementTargetId, setMovementTargetId] = useState<
    string | undefined
  >(undefined);

  // API real con fallback a mocks: si el backend de inventario no está
  // disponible (por ejemplo, migración pendiente), la UI sigue funcionando.
  const apiItemsQuery = useInventoryItems({}, true);
  const apiMode =
    Boolean(apiItemsQuery.data) && !apiItemsQuery.isError;
  const { create, move } = useInventoryMutations();
  const apiMovementsQuery = useInventoryMovements(
    selectedItem?.id,
    apiMode,
  );

  const inventoryList = useMemo(
    () =>
      apiMode
        ? (apiItemsQuery.data ?? []).map(fromApiItem)
        : localInventory,
    [apiMode, apiItemsQuery.data, localInventory],
  );

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (filter !== "all") count++;
    return count;
  }, [selectedCategory, filter]);

  // Infinite scroll pagination state
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Cualquier cambio de filtro reinicia la paginación acumulada.
  const changeFilter = useCallback(
    (value: "all" | "ok" | "bajo" | "critico") => {
      setFilter(value);
      setPage(1);
    },
    [],
  );
  const changeSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);
  const changeCategory = useCallback((value: string) => {
    setSelectedCategory(value);
    setPage(1);
  }, []);

  // Extract categories
  const categories = useMemo(
    () => Array.from(new Set(inventoryList.map((i) => i.category))).sort(),
    [inventoryList],
  );

  // Resilient filtering
  const filtered = useMemo(() => {
    return inventoryList.filter((item) => {
      const st = inventoryStatus(item);
      const matchStatus = filter === "all" || st === filter;
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchCategory && matchSearch;
    });
  }, [inventoryList, filter, selectedCategory, search]);

  // Sliced items for infinite scroll progressive accumulation
  const visibleItems = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = visibleItems.length < filtered.length;

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
    if (apiMode) {
      await apiItemsQuery.refetch();
    } else {
      setLocalInventory([...initialInventory]);
    }
  }, [apiMode, apiItemsQuery]);

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

  // Aggregate counts
  const counts = useMemo(
    () => ({
      ok: inventoryList.filter((i) => inventoryStatus(i) === "ok").length,
      bajo: inventoryList.filter((i) => inventoryStatus(i) === "bajo").length,
      critico: inventoryList.filter((i) => inventoryStatus(i) === "critico").length,
    }),
    [inventoryList],
  );

  // Ledger: movimientos y conciliación entre stock y bitácora
  const movementCount = apiMode
    ? (apiMovementsQuery.data?.length ?? 0)
    : inventoryMovements.length;
  const reconciliationRows = useMemo(
    () =>
      apiMode
        ? []
        : localInventory.filter(
            (item) =>
              getMovementsByItem(item.id).length > 0 &&
              stockFromMovements(item.id) !== item.stock,
          ),
    [apiMode, localInventory],
  );
  const selectedMovements = apiMode
    ? (apiMovementsQuery.data ?? []).map(fromApiMovement)
    : selectedItem
      ? getMovementsByItem(selectedItem.id)
      : [];
  const restockDates = selectedMovements
    .filter((movement) => movement.type === "IN")
    .map((movement) => movement.occurredAt)
    .sort();
  const derivedRestock = restockDates[restockDates.length - 1];

  // Compact metrics for mobile strip (< 1024px / lg:hidden)
  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: "all",
        label: "Total",
        value: inventoryList.length,
        icon: Icons.branch,
        active: filter === "all",
        onClick: () => changeFilter("all"),
      },
      {
        id: "ok",
        label: "Normal",
        value: counts.ok,
        variant: "success",
        icon: Icons.check,
        active: filter === "ok",
        onClick: () => changeFilter(filter === "ok" ? "all" : "ok"),
      },
      {
        id: "bajo",
        label: "Bajo",
        value: counts.bajo,
        variant: "warning",
        icon: Icons.alertTriangle,
        active: filter === "bajo",
        onClick: () => changeFilter(filter === "bajo" ? "all" : "bajo"),
      },
      {
        id: "critico",
        label: "Crítico",
        value: counts.critico,
        variant: "danger",
        icon: Icons.alertTriangle,
        active: filter === "critico",
        onClick: () => changeFilter(filter === "critico" ? "all" : "critico"),
      },
    ],
    [inventoryList.length, counts, filter, changeFilter],
  );

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Inventario Clínico"
        description="Control de existencias de insumos odontológicos, instrumental y reposición de materiales"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setMovementTargetId(undefined);
                setIsMovementModalOpen(true);
              }}
              className="font-semibold text-xs"
            >
              Registrar movimiento
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="font-semibold text-xs shadow-xs"
            >
              <span className="text-base leading-none font-bold">+</span>
              Nuevo insumo
            </Button>
          </div>
        }
      />

      {apiItemsQuery.isError && (
        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 text-xs text-[var(--muted)]">
          No se pudo conectar con la API de inventario. Se muestran datos de
          demostración hasta que el backend esté disponible.
        </div>
      )}

      {/* 2. KPIs Bimodales */}
      {/* Móvil (< 1024px / lg:hidden): CompactStatSummary minimalista en franja horizontal interactiva */}
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
          label="Total Artículos"
          value={inventoryList.length}
          sublabel="En catálogo"
          icon={Icons.branch}
          onClick={() => changeFilter("all")}
          active={filter === "all"}
        />
        <StatCard
          label="Stock Normal"
          value={counts.ok}
          sublabel="Niveles adecuados"
          variant="success"
          icon={Icons.check}
          onClick={() => changeFilter(filter === "ok" ? "all" : "ok")}
          active={filter === "ok"}
        />
        <StatCard
          label="Stock Bajo"
          value={counts.bajo}
          sublabel="Próximos a reponer"
          variant="warning"
          icon={Icons.alertTriangle}
          onClick={() => changeFilter(filter === "bajo" ? "all" : "bajo")}
          active={filter === "bajo"}
        />
        <StatCard
          label="Crítico"
          value={counts.critico}
          sublabel="Atención urgente"
          variant="danger"
          icon={Icons.alertTriangle}
          onClick={() => changeFilter(filter === "critico" ? "all" : "critico")}
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

      {/* 3b. Banner de conciliación stock ↔ bitácora */}
      {reconciliationRows.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900 flex items-start gap-3 shadow-xs">
          <span className="text-xl flex-shrink-0 text-amber-600">⚠</span>
          <div>
            <p className="text-sm font-display font-bold text-amber-700 dark:text-amber-400">
              {reconciliationRows.length} artículo(s) no cuadran con su bitácora
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              El stock registrado difiere de la suma de entradas, salidas y
              ajustes. Revisa antes del próximo reabasto.
            </p>
          </div>
        </div>
      )}

      {/* 4. Filtros y Búsqueda */}
      <FilterToolbar>
        {/* Desktop View (hidden md:flex): Toolbar horizontal completa */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div className="relative flex-1 max-w-sm">
            <Input
              inputSize="sm"
              leftIcon={Icons.search}
              placeholder="Buscar por artículo o categoría…"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="min-w-[150px]">
              <Select
                selectSize="sm"
                value={selectedCategory}
                onChange={(e) => changeCategory(e.target.value)}
                options={[
                  { value: "all", label: "Todas las categorías" },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
            <div className="min-w-[130px]">
              <Select
                selectSize="sm"
                value={filter}
                onChange={(e) =>
                  changeFilter(e.target.value as "all" | "ok" | "bajo" | "critico")
                }
                options={[
                  { value: "all", label: "Todos los estados" },
                  { value: "ok", label: "Stock Normal" },
                  { value: "bajo", label: "Stock Bajo" },
                  { value: "critico", label: "Crítico" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Mobile View (md:hidden): Barra compacta en una sola fila (Input flex-1 + FilterTriggerButton) */}
        <div className="md:hidden flex items-center gap-2 w-full">
          <div className="relative flex-1 min-w-0">
            <Input
              inputSize="sm"
              leftIcon={Icons.search}
              placeholder="Buscar artículo…"
              value={search}
              onChange={(e) => changeSearch(e.target.value)}
            />
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
        title="Filtros de Inventario"
        activeCount={activeFilterCount}
        onClear={() => {
          changeCategory("all");
          changeFilter("all");
        }}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Categoría
            </label>
            <Select
              selectSize="md"
              value={selectedCategory}
              onChange={(e) => changeCategory(e.target.value)}
              options={[
                { value: "all", label: "Todas las categorías" },
                ...categories.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Estado de stock
            </label>
            <Select
              selectSize="md"
              value={filter}
              onChange={(e) =>
                changeFilter(e.target.value as "all" | "ok" | "bajo" | "critico")
              }
              options={[
                { value: "all", label: "Todos los estados" },
                { value: "ok", label: "Stock Normal" },
                { value: "bajo", label: "Stock Bajo" },
                { value: "critico", label: "Crítico" },
              ]}
            />
          </div>
        </div>
      </MobileFilterSheet>

      {/* 5. Listado Responsivo de Inventario */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col gap-4">
        {/* VISTA MÓVIL (< 768px / md:hidden): Tarjetas verticales <article> limpias */}
        <div className="md:hidden flex flex-col gap-3">
          {visibleItems.map((item) => {
            const st = inventoryStatus(item);
            const pct = Math.min(
              item.stock / Math.max(item.minStock * 2, item.stock),
              1,
            );
            return (
              <article
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs flex flex-col gap-3 hover:border-[var(--primary)]/40 transition-colors cursor-pointer"
              >
                {/* Cabecera: Nombre de artículo y badges */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-[var(--foreground)] tracking-tight">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--muted)] border border-[var(--border)] inline-block mt-1">
                      {item.category}
                    </span>
                  </div>
                  <Badge
                    variant={
                      st === "ok"
                        ? "success"
                        : st === "bajo"
                          ? "warning"
                          : "danger"
                    }
                    size="sm"
                  >
                    {statusConfig[st].label}
                  </Badge>
                </div>

                {/* Niveles de stock y barra gráfica */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--muted)] font-mono">
                      Stock actual:{" "}
                      <strong
                        className={`text-sm ${
                          st === "critico"
                            ? "text-[var(--danger)]"
                            : st === "bajo"
                              ? "text-amber-600"
                              : "text-[var(--foreground)]"
                        }`}
                      >
                        {item.stock} {item.unit}
                      </strong>
                    </span>
                    <span className="text-[var(--muted)] font-mono text-[11px]">
                      Mínimo: {item.minStock} {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[var(--border)]/60 rounded-full overflow-hidden">
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

                {/* Fila inferior: Último reabasto */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/60 text-xs text-[var(--muted)] font-mono">
                  <span>
                    Último reabasto:{" "}
                    {new Date(item.lastRefill).toLocaleDateString("es-BO", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[var(--primary)] font-semibold">
                    Ver bitácora →
                  </span>
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
                    "Artículo",
                    "Stock actual",
                    "Stock mínimo",
                    "Unidad",
                    "Último reabasto",
                    "Estado",
                    "Bitácora",
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
                {visibleItems.map((item) => {
                  const st = inventoryStatus(item);
                  const pct = Math.min(
                    item.stock / Math.max(item.minStock * 2, item.stock),
                    1,
                  );
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-[var(--background)]/60 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                          {item.name}
                        </p>
                        <span className="text-[10px] font-mono text-[var(--muted)] opacity-75">
                          {item.category}
                        </span>
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
                      <td className="px-4 py-3.5 text-xs font-mono text-[var(--muted)] whitespace-nowrap">
                        {new Date(item.lastRefill).toLocaleDateString("es-BO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${statusConfig[st].color}`}
                        >
                          {statusConfig[st].label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedItem(item);
                          }}
                          className="text-xs font-mono font-semibold text-[var(--primary)] hover:underline whitespace-nowrap"
                        >
                          Ver bitácora
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-[var(--muted)]">
              Sin artículos para los filtros seleccionados
            </div>
          )}

          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--background)]/30 flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span>
              {filtered.length} artículos
              {!apiMode && ` · ${movementCount} movimientos`}
            </span>
            <span>
              Mostrando {visibleItems.length} de {filtered.length}
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
              <span>Cargando más artículos…</span>
            </div>
          )}
          {!hasMore && visibleItems.length > 0 && (
            <p className="text-[11px] font-mono text-[var(--muted)] opacity-60">
              Todos los artículos de inventario cargados ({visibleItems.length} de{" "}
              {filtered.length})
            </p>
          )}
        </div>
      </div>
    </PullToRefresh>

    <ResponsiveModal
      open={selectedItem !== null}
      onClose={() => setSelectedItem(null)}
      eyebrow="Bitácora de inventario"
      title={selectedItem?.name ?? "Bitácora"}
      subtitle={
        selectedItem
          ? `${selectedItem.category} · ${selectedItem.stock} ${selectedItem.unit} en stock`
          : undefined
      }
      maxWidth="max-w-lg"
      footer={
        <Button
          variant="primary"
          onClick={() => {
            const id = selectedItem?.id;
            setSelectedItem(null);
            setMovementTargetId(id);
            setIsMovementModalOpen(true);
          }}
        >
          Registrar movimiento
        </Button>
      }
    >
      {selectedItem && (
        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div className="border border-[var(--border)] rounded-md p-3">
              <dt className="font-mono uppercase tracking-wider text-[9px] text-[var(--muted)]">
                Último reabasto
              </dt>
              <dd className="font-mono text-[var(--foreground)] mt-1">
                {formatMovementDate(selectedItem.lastRefill)}
              </dd>
              {derivedRestock && (
                <dd
                  className={`text-[10px] font-mono mt-1 ${
                    derivedRestock === selectedItem.lastRefill
                      ? "text-emerald-600"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {derivedRestock === selectedItem.lastRefill
                    ? "Coincide con la bitácora"
                    : `Bitácora: ${formatMovementDate(derivedRestock)}`}
                </dd>
              )}
            </div>
            <div className="border border-[var(--border)] rounded-md p-3">
              <dt className="font-mono uppercase tracking-wider text-[9px] text-[var(--muted)]">
                Stock mínimo
              </dt>
              <dd className="font-mono text-[var(--foreground)] mt-1">
                {selectedItem.minStock} {selectedItem.unit}
              </dd>
            </div>
            <div className="border border-[var(--border)] rounded-md p-3">
              <dt className="font-mono uppercase tracking-wider text-[9px] text-[var(--muted)]">
                Stock según bitácora
              </dt>
              <dd className="font-mono text-[var(--foreground)] mt-1">
                {apiMode
                  ? selectedItem.stock
                  : stockFromMovements(selectedItem.id)}{" "}
                {selectedItem.unit}
              </dd>
            </div>
            <div className="border border-[var(--border)] rounded-md p-3">
              <dt className="font-mono uppercase tracking-wider text-[9px] text-[var(--muted)]">
                Movimientos
              </dt>
              <dd className="font-mono text-[var(--foreground)] mt-1">
                {selectedMovements.length}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            {selectedMovements.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">
                Sin movimientos registrados para este artículo.
              </p>
            ) : (
              selectedMovements.map((movement) => {
                const signed = signedQuantity(movement);
                return (
                  <div
                    key={movement.id}
                    className="border border-[var(--border)] rounded-md p-3 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-mono uppercase rounded-[2px] ${movementConfig[movement.type].color}`}
                      >
                        {movementConfig[movement.type].label}
                      </span>
                      <span
                        className={`text-sm font-display font-bold ${
                          signed > 0
                            ? "text-emerald-600"
                            : movement.type === "ADJUSTMENT"
                              ? "text-[var(--muted)]"
                              : "text-amber-600"
                        }`}
                      >
                        {signed > 0 ? `+${signed}` : signed}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] leading-snug">
                      {movement.reason}
                    </p>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-[var(--muted)]">
                      {formatMovementDate(movement.occurredAt)}
                      {movement.professionalId &&
                        ` · ${
                          getProfessionalById(movement.professionalId)?.name ??
                          ""
                        }`}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </ResponsiveModal>

    <RegisterInventoryMovementModal
      key={movementTargetId ?? "any"}
      open={isMovementModalOpen}
      onClose={() => setIsMovementModalOpen(false)}
      items={inventoryList}
      defaultItemId={movementTargetId}
      onRegister={
        apiMode
          ? async (itemId, payload) => {
              await move.mutateAsync({ itemId, payload });
            }
          : undefined
      }
      onSuccess={
        apiMode
          ? undefined
          : (movement) => {
              // El stock denormalizado se recalcula desde la bitácora para
              // que siempre concilien.
              setLocalInventory((current) =>
                current.map((item) =>
                  item.id === movement.itemId
                    ? {
                        ...item,
                        stock: stockFromMovements(item.id),
                      }
                    : item,
                ),
              );
            }
      }
    />

    <CreateInventoryModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={
          apiMode
            ? async (payload) => {
                await create.mutateAsync(payload);
              }
            : undefined
        }
        onSuccess={
          apiMode
            ? undefined
            : () => {
                setLocalInventory([...localInventory]);
              }
        }
      />
    </PageContainer>
  );
}
