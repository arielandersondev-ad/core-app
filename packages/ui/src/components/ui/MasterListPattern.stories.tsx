import type { Meta, StoryObj } from "@storybook/react";
import { useState, useCallback } from "react";
import { PageHeader } from "../layout/PageHeader";
import { FilterToolbar } from "../layout/FilterToolbar";
import { StatCard } from "./StatCard";
import { CompactStatSummary, type CompactStatItem } from "./CompactStatSummary";
import { ResponsiveTable } from "./ResponsiveTable";
import { MobileCardItem } from "./MobileCardItem";
import { InfiniteScrollSentinel } from "./InfiniteScrollSentinel";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { Input } from "./Input";
import { Icons } from "./Icons";
import { Avatar } from "./Avatar";

const meta: Meta = {
  title: "Patterns/MasterListPattern",
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component: `
# Patrón Maestro de Listados (Master List Architecture)

Estándar canónico transversal para todas las vistas de colecciones de datos en el monorepo (Tratamientos, Pacientes, Inventario, Usuarios, Organizaciones, Roles y Planes).

### Los 5 Pilares de la Arquitectura:
1. **Cabecera (\`PageHeader\`):** Título descriptivo, contexto y botón de acción primaria (ej. \`+ Nuevo registro\`).
2. **KPIs Bimodales:**
   - **Móvil (< 768px):** Franja horizontal minimalista de una sola línea (\`CompactStatSummary\` ~38px) con scroll suave, liberando el 85% del viewport vertical.
   - **Desktop (>= 768px):** Cuadrícula expandida de \`StatCard\` con valores destacados y métricas completas.
3. **Filtros (\`FilterToolbar\`):** Barra de búsqueda con debounce (~250ms) y selectores/toggles de estado sin salto de página forzado.
4. **Listado Bimodal Responsivo (\`ResponsiveTable\`):**
   - **Desktop (>= 768px):** Tabla tradicional (\`<table>\`) con encabezados, tipografía mono y alineación ordenada.
   - **Móvil (< 768px):** Tarjetas verticales limpias (\`MobileCardItem\`), eliminando terminantemente el scroll horizontal en móviles.
5. **Centinela de Scroll Infinito (\`InfiniteScrollSentinel\` / \`useInfiniteScroll\`):**
   - IntersectionObserver anticipado (\`rootMargin: "200px"\`) para carga progresiva continua por lotes sin paginación rígida.
   - Spinner discreto animado durante la carga de lotes subsiguientes (\`isLoadingMore\`).
   - Mensaje de fin de catálogo (\`endMessage\`) al alcanzar el total de registros disponibles.
        `,
      },
    },
  },
};

export default meta;

interface ClinicalServiceItem {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  priceMinor: number;
  isActive: boolean;
}

const mockCatalogDatabase: ClinicalServiceItem[] = [
  { id: "1", name: "Limpieza Dental y Profilaxis", category: "Prevención", durationMinutes: 30, priceMinor: 15000, isActive: true },
  { id: "2", name: "Extracción Simple de Tercer Molar", category: "Cirugía", durationMinutes: 45, priceMinor: 35000, isActive: true },
  { id: "3", name: "Restauración Estética con Resina", category: "Operatoria", durationMinutes: 40, priceMinor: 22000, isActive: true },
  { id: "4", name: "Tratamiento de Conducto Unirradicular", category: "Endodoncia", durationMinutes: 60, priceMinor: 55000, isActive: true },
  { id: "5", name: "Blanqueamiento Dental LED", category: "Estética", durationMinutes: 50, priceMinor: 48000, isActive: true },
  { id: "6", name: "Corona de Porcelana Libre de Metal", category: "Rehabilitación", durationMinutes: 90, priceMinor: 95000, isActive: true },
  { id: "7", name: "Radiografía Panorámica Digital", category: "Diagnóstico", durationMinutes: 15, priceMinor: 12000, isActive: true },
  { id: "8", name: "Gingivectomía Estética por Cuadrante", category: "Periodoncia", durationMinutes: 45, priceMinor: 38000, isActive: false },
  { id: "9", name: "Implante Dental Titanio Grado 4", category: "Implantología", durationMinutes: 60, priceMinor: 120000, isActive: true },
  { id: "10", name: "Mantenedor de Espacio Fijo", category: "Odontopediatría", durationMinutes: 30, priceMinor: 28000, isActive: true },
  { id: "11", name: "Férula Miorrelajante Bruxismo", category: "Oclusión", durationMinutes: 30, priceMinor: 42000, isActive: true },
  { id: "12", name: "Tratamiento de Ortodoncia Mensual", category: "Ortodoncia", durationMinutes: 30, priceMinor: 25000, isActive: true },
];

/**
 * Demostración interactiva completa del Patrón Maestro de Listados con Scroll Infinito simulado.
 */
export const CompleteMasterListDemo: StoryObj = {
  render: () => {
    const PAGE_SIZE = 4;
    const [page, setPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [search, setSearch] = useState("");

    // Filtrado en memoria
    const filtered = mockCatalogDatabase.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const items = filtered.slice(0, page * PAGE_SIZE);
    const hasMore = items.length < total;

    // Simulación de carga asíncrona de siguiente lote
    const handleLoadMore = useCallback(async () => {
      if (isLoadingMore || !hasMore) return;
      setIsLoadingMore(true);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setPage((prev) => prev + 1);
      setIsLoadingMore(false);
    }, [isLoadingMore, hasMore]);

    // KPIs compactos para móvil
    const compactKPIs: CompactStatItem[] = [
      { id: "total", label: "Servicios", value: total, icon: Icons.shield },
      { id: "active", label: "Activos", value: filtered.filter((i) => i.isActive).length, variant: "success", icon: Icons.check },
      { id: "cats", label: "Especialidades", value: 8, variant: "warning", icon: Icons.branch },
      { id: "avg", label: "Promedio", value: "350.00", prefix: "Bs.", variant: "accent" },
    ];

    return (
      <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-5">
        {/* Pilar 1: Cabecera Canónica */}
        <PageHeader
          title="Catálogo Maestro de Tratamientos"
          description="Estandarización de servicios clínicos, aranceles y procedimientos odontológicos."
          action={
            <Button variant="primary" leftIcon={Icons.plus} className="font-semibold text-xs shadow-xs">
              Nuevo Tratamiento
            </Button>
          }
        />

        {/* Pilar 2: KPIs Bimodales */}
        {/* Móvil: Franja horizontal minimalista (~38px) */}
        <div className="md:hidden">
          <CompactStatSummary items={compactKPIs} />
        </div>

        {/* Desktop: Grid de StatCards */}
        <div className="hidden md:grid grid-cols-4 gap-3.5">
          <StatCard label="Total Tratamientos" value={total} sublabel="Catálogo activo" icon={Icons.shield} />
          <StatCard label="Activos en Agenda" value={filtered.filter((i) => i.isActive).length} sublabel="Disponibles" variant="success" icon={Icons.check} />
          <StatCard label="Especialidades" value={8} sublabel="Áreas clínicas" icon={Icons.branch} />
          <StatCard label="Arancel Promedio" value="Bs. 350.00" sublabel="Por procedimiento" variant="accent" icon={Icons.trending} />
        </div>

        {/* Pilar 3: Filtros con debounce */}
        <FilterToolbar>
          <div className="relative flex-1 max-w-sm">
            <Input
              inputSize="sm"
              leftIcon={Icons.search}
              placeholder="Buscar por procedimiento o especialidad…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--muted)] ml-auto">
            Mostrando {items.length} de {total} registros
          </span>
        </FilterToolbar>

        {/* Pilar 4: Listado Bimodal Responsivo */}
        <ResponsiveTable<ClinicalServiceItem>
          items={items}
          caption="Catálogo clínico"
          columns={[
            {
              header: "Procedimiento",
              accessor: (s) => (
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} size="sm" />
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{s.name}</p>
                    <p className="text-xs text-[var(--muted)]">{s.category}</p>
                  </div>
                </div>
              ),
            },
            {
              header: "Duración",
              accessor: (s) => `${s.durationMinutes} min`,
              className: "font-mono text-xs",
            },
            {
              header: "Arancel Base",
              accessor: (s) => `Bs. ${(s.priceMinor / 100).toFixed(2)}`,
              className: "font-mono font-bold text-[var(--primary)]",
            },
            {
              header: "Estado",
              accessor: (s) => (
                <Badge variant={s.isActive ? "success" : "neutral"} size="sm">
                  {s.isActive ? "Activo" : "Inactivo"}
                </Badge>
              ),
            },
          ]}
          renderCard={(s) => (
            <MobileCardItem
              avatar={<Avatar name={s.name} size="sm" />}
              title={s.name}
              subtitle={s.category}
              badge={
                <Badge variant={s.isActive ? "success" : "neutral"} size="sm">
                  {s.isActive ? "Activo" : "Inactivo"}
                </Badge>
              }
              fields={[
                { label: "Duración", value: `⏱ ${s.durationMinutes} min`, mono: true },
                { label: "Arancel", value: `Bs. ${(s.priceMinor / 100).toFixed(2)}`, mono: true },
              ]}
              actions={
                <Button size="sm" variant="ghost">
                  Editar arancel →
                </Button>
              }
            />
          )}
        />

        {/* Pilar 5: Centinela de Scroll Infinito */}
        <InfiniteScrollSentinel
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          total={total}
          currentCount={items.length}
          loadingMessage="Cargando más procedimientos clínicos…"
          endMessage={`Has llegado al final del catálogo (${items.length} de ${total} tratamientos)`}
        />
      </div>
    );
  },
};
