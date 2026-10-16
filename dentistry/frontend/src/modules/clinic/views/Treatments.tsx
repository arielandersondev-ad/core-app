"use client";

import { useState } from "react";
import { services, formatCurrency } from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader, FilterToolbar } from "@/shared/components/layout";
import { StatCard, Button, Input, EmptyState, Icons } from "@/shared/components/ui";

export default function Treatments({
  onNavigate,
}: {
  onNavigate: (s: string, p?: Record<string, string>) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = services.filter((s) => {
    const matchActive = showInactive ? true : s.active;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    return matchActive && matchSearch;
  });

  const categories = [...new Set(services.map((s) => s.category))];
  const activeCount = services.filter((s) => s.active).length;
  const avgPrice =
    activeCount > 0
      ? services.filter((s) => s.active).reduce((sum, s) => sum + s.price, 0) /
        activeCount
      : 0;

  return (
    <PageContainer>
      {/* 1. Cabecera */}
      <PageHeader
        title="Planes de Tratamiento"
        description="Catálogo de procedimientos clínicos, especialidades y aranceles odontológicos"
        action={
          <Button
            variant="primary"
            onClick={() => onNavigate("crear-servicio")}
            className="font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nuevo servicio
          </Button>
        }
      />

      {/* 2. KPIs y Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Servicios"
          value={services.length}
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
          value={categories.length}
          sublabel="Especialidades activas"
          icon={Icons.branch}
        />
        <StatCard
          label="Precio Promedio"
          value={formatCurrency(avgPrice)}
          sublabel="Por tratamiento"
          variant="accent"
        />
      </div>

      {/* 3. Filtros y Búsqueda */}
      <FilterToolbar>
        <div className="relative flex-1 max-w-sm">
          <Input
            inputSize="sm"
            leftIcon={Icons.search}
            placeholder="Buscar por servicio o categoría…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-mono text-[var(--muted)] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
          />
          Mostrar inactivos
        </label>
      </FilterToolbar>

      {/* 4. Tablas por Categoría */}
      <div className="flex flex-col gap-6">
        {categories.map((cat) => {
          const catServices = filtered.filter((s) => s.category === cat);
          if (catServices.length === 0) return null;

          return (
            <div key={cat} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
                  {cat}
                </h2>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {catServices.length} {catServices.length === 1 ? "servicio" : "servicios"}
                </span>
              </div>

              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                        {[
                          "Servicio",
                          "Descripción",
                          "Duración",
                          "Precio base",
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
                      {catServices.map((svc) => (
                        <tr
                          key={svc.id}
                          className="hover:bg-[var(--background)]/60 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-display font-semibold text-[var(--foreground)]">
                              {svc.name}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-[var(--muted)] max-w-sm">
                            {svc.description}
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono text-[var(--foreground)]">
                            {svc.durationMin} min
                          </td>
                          <td className="px-4 py-3.5 text-sm font-display font-bold text-[var(--primary)]">
                            {formatCurrency(svc.price)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium rounded-md ${
                                svc.active
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border border-stone-200 dark:border-stone-800"
                              }`}
                            >
                              {svc.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <EmptyState message={`Sin servicios encontrados para "${search}"`} />
        )}
      </div>
    </PageContainer>
  );
}
