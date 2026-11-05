"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  services as initialMockServices,
  formatCurrency,
  Service,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import {
  StatCard,
  CompactStatSummary,
  CompactStatItem,
  Button,
  Input,
  Select,
  Badge,
  EmptyState,
  Icons,
  MobileFloatingActionMenu,
  MobileFilterSheet,
  FilterTriggerButton,
} from "@/shared/components/ui";
import {
  fetchDentalServicesPaginated,
  DentalServiceDto,
} from "@/modules/clinic/api/services";
import { ServiceFormModal } from "./ServiceFormModal";

const PAGE_SIZE = 15;

export interface TreatmentItem {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMin: number;
  price: number;
  isActive: boolean;
  code?: string;
}

function mapDtoToTreatment(dto: DentalServiceDto): TreatmentItem {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category || "General",
    description: dto.description || "",
    durationMin: dto.durationMinutes || 30,
    price: dto.basePriceMinor ? dto.basePriceMinor / 100 : 0,
    isActive: dto.isActive,
    code: dto.code || undefined,
  };
}

function mapMockToTreatment(mock: Service): TreatmentItem {
  return {
    id: mock.id,
    name: mock.name,
    category: mock.category || "General",
    description: mock.description || "",
    durationMin: mock.durationMin || 30,
    price: mock.price || 0,
    isActive: mock.isActive,
    code: mock.code,
  };
}

export default function Treatments({
  onNavigate,
}: {
  onNavigate?: (s: string, p?: Record<string, string>) => void;
}) {
  // Filters state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Pagination & List state
  const [items, setItems] = useState<TreatmentItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Local catalog baseline for stats and fallbacks
  const [localCatalog, setLocalCatalog] = useState<Service[]>(initialMockServices);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<TreatmentItem | null>(null);

  // Active filter count for mobile badge
  const activeFilterCount = useMemo(() => {
    return (selectedCategory !== "all" ? 1 : 0) + (statusFilter !== "all" ? 1 : 0);
  }, [selectedCategory, statusFilter]);

  // Sentinel ref for infinite scroll IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input (250ms) to avoid spamming requests while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Extract all unique categories
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    localCatalog.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set).sort();
  }, [localCatalog]);

  // Overall catalog KPI metrics
  const totalCount = localCatalog.length;
  const activeCount = useMemo(
    () => localCatalog.filter((s) => s.isActive).length,
    [localCatalog],
  );
  const categoriesCount = categoriesList.length;
  const avgPrice = useMemo(() => {
    const active = localCatalog.filter((s) => s.isActive);
    if (active.length === 0) return 0;
    return active.reduce((sum, s) => sum + s.price, 0) / active.length;
  }, [localCatalog]);

  // Compact metrics for mobile strip
  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: "total",
        label: "Total",
        value: totalCount,
        icon: Icons.shield,
      },
      {
        id: "active",
        label: "Activos",
        value: activeCount,
        variant: "success",
        icon: Icons.check,
      },
      {
        id: "categories",
        label: "Categorías",
        value: categoriesCount,
        icon: Icons.branch,
      },
      {
        id: "avgPrice",
        label: "Promedio",
        value: formatCurrency(avgPrice),
        variant: "accent",
        icon: Icons.dollarSign,
      },
    ],
    [totalCount, activeCount, categoriesCount, avgPrice],
  );

  // Main data loader
  const loadPage = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (reset) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = {
          page: targetPage,
          limit: PAGE_SIZE,
          search: debouncedSearch.trim() || undefined,
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          isActive:
            statusFilter === "all"
              ? undefined
              : statusFilter === "active"
                ? true
                : false,
        };

        const res = await fetchDentalServicesPaginated(params);

        if (res.items && res.items.length > 0) {
          const mapped = res.items.map(mapDtoToTreatment);
          setItems((prev) => (reset ? mapped : [...prev, ...mapped]));
          setTotal(res.total);
          setHasMore(res.hasMore);
          setPage(res.page);
        } else {
          // Fallback to local mock catalog with resilient client filtering
          const filtered = localCatalog.filter((s) => {
            if (selectedCategory !== "all" && s.category !== selectedCategory) {
              return false;
            }
            if (statusFilter === "active" && !s.isActive) return false;
            if (statusFilter === "inactive" && s.isActive) return false;

            if (debouncedSearch.trim()) {
              const q = debouncedSearch.toLowerCase();
              const matchName = s.name.toLowerCase().includes(q);
              const matchCode = s.code?.toLowerCase().includes(q);
              const matchCat = s.category?.toLowerCase().includes(q);
              const matchDesc = s.description?.toLowerCase().includes(q);
              if (!matchName && !matchCode && !matchCat && !matchDesc) {
                return false;
              }
            }
            return true;
          });

          const start = (targetPage - 1) * PAGE_SIZE;
          const end = start + PAGE_SIZE;
          const pageSlice = filtered.slice(start, end).map(mapMockToTreatment);

          setItems((prev) => (reset ? pageSlice : [...prev, ...pageSlice]));
          setTotal(filtered.length);
          setHasMore(end < filtered.length);
          setPage(targetPage);
        }
      } catch (err) {
        console.error("Error loading dental services:", err);
        // Fail-safe: empty or preserved state
        if (reset) setItems([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, selectedCategory, statusFilter, localCatalog],
  );

  // Requirement: Filter resilience. Reset to page 1 whenever filters change.
  useEffect(() => {
    setPage(1);
    loadPage(1, true);
  }, [debouncedSearch, selectedCategory, statusFilter, loadPage]);

  // IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadPage(page + 1, false);
        }
      },
      {
        root: null,
        rootMargin: "150px", // Pre-fetch slightly before hitting bottom
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, page, loadPage]);

  // Service form actions (Create / Edit)
  const handleOpenCreate = () => {
    setEditingService(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (svc: TreatmentItem) => {
    const found = localCatalog.find((s) => s.id === svc.id) || {
      id: svc.id,
      name: svc.name,
      code: svc.code,
      category: svc.category,
      description: svc.description,
      durationMin: svc.durationMin,
      price: svc.price,
      isActive: svc.isActive,
    };
    setEditingService(found);
    setIsFormModalOpen(true);
  };

  const handleSaveService = (data: Partial<Service>) => {
    if (editingService) {
      // Update
      setLocalCatalog((prev) =>
        prev.map((s) => (s.id === editingService.id ? ({ ...s, ...data } as Service) : s)),
      );
    } else {
      // Create
      const newService: Service = {
        id: `svc-${Date.now()}`,
        name: data.name || "Nuevo Servicio",
        code: data.code,
        category: data.category || "General",
        description: data.description || "",
        durationMin: data.durationMin || 30,
        price: data.price || 0,
        labCost: data.labCost || 0,
        isActive: data.isActive ?? true,
        supplies: data.supplies || [],
      };
      setLocalCatalog((prev) => [newService, ...prev]);
    }
    setIsFormModalOpen(false);
    setEditingService(null);
  };

  const handleDeleteConfirm = () => {
    if (!deletingService) return;
    setLocalCatalog((prev) => prev.filter((s) => s.id !== deletingService.id));
    setItems((prev) => prev.filter((s) => s.id !== deletingService.id));
    setTotal((prev) => Math.max(0, prev - 1));
    setDeletingService(null);
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Planes de Tratamiento"
        description="Catálogo de procedimientos clínicos, especialidades y aranceles odontológicos"
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreate}
            className="hidden md:inline-flex font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nuevo servicio
          </Button>
        }
      />

      {/* 2. KPIs y Métricas */}
      {/* Mobile/Tablet (< 1024px / lg:hidden): CompactStatSummary minimalista en una franja horizontal */}
      <div className="lg:hidden">
        <CompactStatSummary
          items={compactMetrics}
          variant="pill"
          className="py-1"
        />
      </div>

      {/* Desktop (>= 1024px / lg:grid): 4 StatCards tradicionales */}
      <div className="hidden lg:grid grid-cols-4 gap-3.5">
        <StatCard
          label="Total Servicios"
          value={totalCount}
          sublabel="En catálogo clínico"
          icon={Icons.shield}
        />
        <StatCard
          label="Servicios Activos"
          value={activeCount}
          sublabel="Disponibles en agenda"
          variant="success"
          icon={Icons.check}
        />
        <StatCard
          label="Categorías"
          value={categoriesCount}
          sublabel="Especialidades activas"
          icon={Icons.branch}
        />
        <StatCard
          label="Precio Promedio"
          value={formatCurrency(avgPrice)}
          sublabel="Por tratamiento"
          variant="accent"
          icon={Icons.dollarSign}
        />
      </div>

      {/* 3. Filtros y Búsqueda */}
      <FilterToolbar>
        {/* Desktop View (hidden md:flex): Toolbar horizontal completa */}
        <div className="hidden md:flex items-center justify-between gap-3 w-full">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Input
              inputSize="sm"
              leftIcon={Icons.search}
              placeholder="Buscar por servicio o categoría…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de Categorías */}
            <div className="min-w-[150px]">
              <Select
                selectSize="sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[
                  { value: "all", label: "Todas las categorías" },
                  ...categoriesList.map((cat) => ({ value: cat, label: cat })),
                ]}
              />
            </div>

            {/* Selector de Estado */}
            <div className="min-w-[130px]">
              <Select
                selectSize="sm"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "inactive")
                }
                options={[
                  { value: "all", label: "Todos los estados" },
                  { value: "active", label: "Solo Activos" },
                  { value: "inactive", label: "Solo Inactivos" },
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
              placeholder="Buscar servicio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        title="Filtros de Tratamientos"
        activeCount={activeFilterCount}
        onClear={() => {
          setSelectedCategory("all");
          setStatusFilter("all");
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
              onChange={(e) => setSelectedCategory(e.target.value)}
              options={[
                { value: "all", label: "Todas las categorías" },
                ...categoriesList.map((cat) => ({ value: cat, label: cat })),
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
              Estado
            </label>
            <Select
              selectSize="md"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
              options={[
                { value: "all", label: "Todos los estados" },
                { value: "active", label: "Solo Activos" },
                { value: "inactive", label: "Solo Inactivos" },
              ]}
            />
          </div>
        </div>
      </MobileFilterSheet>

      {/* 4. Listado Responsivo de Tratamientos */}
      {/* Estado inicial de carga */}
      {isLoading && items.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xs">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-xs font-mono text-[var(--muted)]">
            Cargando catálogo de tratamientos…
          </p>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          message={
            debouncedSearch || selectedCategory !== "all" || statusFilter !== "all"
              ? `Sin servicios encontrados para los filtros aplicados`
              : "No hay tratamientos registrados en el catálogo"
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {/* VISTA MÓVIL (< 768px / md:hidden): Tarjetas verticales <article> */}
          <div className="md:hidden flex flex-col gap-3">
            {items.map((svc) => (
              <article
                key={svc.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs flex flex-col gap-3 transition-colors hover:border-[var(--primary)]/40"
              >
                {/* Cabecera de tarjeta: Nombre destacado en negrita + chips */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-display font-semibold text-[var(--foreground)] tracking-tight">
                      {svc.name}
                    </h3>
                    {svc.code && (
                      <span className="text-[10px] font-mono text-[var(--muted)] opacity-75">
                        Cód: {svc.code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--muted)] border border-[var(--border)]">
                      {svc.category}
                    </span>
                    <Badge
                      variant={svc.isActive ? "success" : "neutral"}
                      size="sm"
                    >
                      {svc.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                {/* Descripción legible con leading-relaxed */}
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {svc.description || "Sin descripción clínica registrada."}
                </p>

                {/* Fila inferior: Duración y Precio grande resaltado */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]/70">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--muted)]">
                    <span className="text-sm">⏱</span> {svc.durationMin} min
                  </span>
                  <span className="text-base font-display font-bold text-[var(--primary)] tracking-tight">
                    {formatCurrency(svc.price)}
                  </span>
                </div>

                {/* Acciones accesibles (Editar / Eliminar) */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]/40">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(svc)}
                    className="text-xs font-medium px-3 h-8"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingService(svc)}
                    className="text-xs font-medium px-3 h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    Eliminar
                  </Button>
                </div>
              </article>
            ))}
          </div>

          {/* VISTA DESKTOP (>= 768px / hidden md:block): Tabla tradicional completa */}
          <div className="hidden md:block bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                    {[
                      "Servicio",
                      "Categoría",
                      "Descripción",
                      "Duración",
                      "Precio base",
                      "Estado",
                      "Acciones",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] ${
                          h === "Acciones" ? "text-right" : ""
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((svc) => (
                    <tr
                      key={svc.id}
                      className="hover:bg-[var(--background)]/60 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                          {svc.name}
                        </p>
                        {svc.code && (
                          <span className="text-[10px] font-mono text-[var(--muted)] opacity-80">
                            Cód: {svc.code}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--muted)] border border-[var(--border)]">
                          {svc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-[var(--muted)] max-w-xs leading-relaxed">
                        {svc.description || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-[var(--foreground)]">
                        {svc.durationMin} min
                      </td>
                      <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--primary)] whitespace-nowrap">
                        {formatCurrency(svc.price)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={svc.isActive ? "success" : "neutral"}
                          size="sm"
                        >
                          {svc.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(svc)}
                            className="text-xs h-7 px-2.5"
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingService(svc)}
                            className="text-xs h-7 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Centinela y Footer para Scroll Infinito */}
          <div
            ref={sentinelRef}
            className="py-4 flex flex-col items-center justify-center gap-2 min-h-[48px]"
          >
            {isLoadingMore && (
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
                <div className="w-4 h-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <span>Cargando más tratamientos…</span>
              </div>
            )}
            {!hasMore && items.length > 0 && !isLoading && (
              <p className="text-[11px] font-mono text-[var(--muted)] opacity-60">
                Has llegado al final del catálogo ({items.length} de {total} tratamientos)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Menú Flotante de Acciones Rápidas Móvil (Speed-Dial FAB) */}
      <MobileFloatingActionMenu
        ariaLabel="Acciones rápidas de tratamientos"
        className="md:hidden"
        actions={[
          {
            label: "Nuevo Servicio",
            icon: Icons.plus,
            variant: "primary",
            onClick: handleOpenCreate,
          },
        ]}
      />

      {/* Modal de Creación / Edición de Servicio */}
      <ServiceFormModal
        isOpen={isFormModalOpen}
        service={editingService}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center text-lg font-bold shrink-0">
                ⚠
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  ¿Eliminar tratamiento?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5 leading-relaxed">
                  Esta acción eliminará el servicio{" "}
                  <strong className="text-[var(--foreground)]">
                    &quot;{deletingService.name}&quot;
                  </strong>{" "}
                  del catálogo clínico.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingService(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                Sí, Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
