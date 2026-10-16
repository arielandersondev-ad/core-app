"use client";

import {
  formatCurrency,
  services as initialServices,
  Service,
} from "@/modules/clinic/__mocks__/data";
import { FilterToolbar, PageContainer, PageHeader } from "@/shared/components/layout";
import { Button, Input, StatCard } from "@/shared/components/ui";
import { Icons } from "@/shared/components/ui/Icons";
import { useState } from "react";
import { ServiceFormModal } from "./ServiceFormModal";

export default function Services() {
  const [servicesList, setServicesList] = useState<Service[]>(initialServices);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingService, setDeletingService] = useState<Service | null>(null);

  // Categories list
  const categories = [
    "all",
    ...Array.from(new Set(servicesList.map((s) => s.category).filter(Boolean))),
  ];

  // Filtered services
  const filteredServices = servicesList.filter((s) => {
    if (selectedCategory !== "all" && s.category !== selectedCategory)
      return false;
    if (statusFilter === "active" && !s.active) return false;
    if (statusFilter === "inactive" && s.active) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchCode = s.code?.toLowerCase().includes(q);
      const matchCat = s.category?.toLowerCase().includes(q);
      const matchDesc = s.description?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCat && !matchDesc) return false;
    }

    return true;
  });

  // Quick stats
  const totalCount = servicesList.length;
  const activeCount = servicesList.filter((s) => s.active).length;
  const avgDuration =
    totalCount > 0
      ? Math.round(
          servicesList.reduce((sum, s) => sum + s.durationMin, 0) / totalCount,
        )
      : 0;
  const avgPrice =
    totalCount > 0
      ? Math.round(
          servicesList.reduce((sum, s) => sum + s.price, 0) / totalCount,
        )
      : 0;

  // CRUD Handlers
  const handleCreate = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleEdit = (svc: Service) => {
    setEditingService(svc);
    setIsModalOpen(true);
  };

  const handleSave = (formData: Partial<Service>) => {
    if (editingService) {
      setServicesList((prev) =>
        prev.map((s) =>
          s.id === editingService.id ? ({ ...s, ...formData } as Service) : s,
        ),
      );
    } else {
      const newSvc: Service = {
        id: `svc-${Date.now()}`,
        code: formData.code || `SRV-${servicesList.length + 1}`,
        name: formData.name || "Nuevo Servicio",
        durationMin: formData.durationMin || 30,
        price: formData.price || 0,
        labCost: formData.labCost || 0,
        category: formData.category || "General",
        description: formData.description || "",
        active: formData.active ?? true,
        supplies: formData.supplies || [],
      };
      setServicesList((prev) => [newSvc, ...prev]);
    }
  };

  const handleToggleStatus = (id: string) => {
    setServicesList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  };

  const handleDeleteConfirm = () => {
    if (deletingService) {
      setServicesList((prev) =>
        prev.filter((s) => s.id !== deletingService.id),
      );
      setDeletingService(null);
    }
  };

  return (
    <PageContainer>
      {/* 1. Header */}
      <PageHeader
        title="Servicios Odontológicos"
        description="Catálogo de tratamientos, duraciones clínicas, costos de insumos y precios al paciente"
        action={
          <Button
            onClick={handleCreate}
            variant="primary"
            className="flex items-center gap-2 self-start sm:self-auto font-semibold text-xs shadow-xs"
          >
            <span className="text-base leading-none font-bold">+</span>
            Nuevo Servicio
          </Button>
        }
      />

      {/* 2. Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <StatCard
          label="Total Servicios"
          value={totalCount}
          sublabel={`${categories.length - 1} especialidades`}
          icon={Icons.shield}
        />
        <StatCard
          label="Servicios Activos"
          value={activeCount}
          sublabel="Disponibles en agenda"
          variant="success"
          icon={Icons.plus}
        />
        <StatCard
          label="Duración Promedio"
          value={`${avgDuration} min`}
          sublabel="Por sesión clínica"
          icon={Icons.calendar}
        />
        <StatCard
          label="Precio Promedio"
          value={formatCurrency(avgPrice)}
          sublabel="Arancel base"
          variant="accent"
        />
      </div>

      {/* 3. Controls & Filters Bar */}
      <FilterToolbar>
        <div className="relative flex-1 max-w-md">
          <Input
            inputSize="sm"
            leftIcon={Icons.search}
            placeholder="Buscar por nombre, código o descripción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] flex-shrink-0">
            Estado:
          </span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === "all"
                ? "bg-[var(--primary)] text-white border-[var(--primary)] font-semibold"
                : "bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === "active"
                ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                : "bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            Activos
          </button>
          <button
            onClick={() => setStatusFilter("inactive")}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === "inactive"
                ? "bg-zinc-600 text-white border-zinc-600 font-semibold"
                : "bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--foreground)]"
            }`}
          >
            Inactivos
          </button>
        </div>
      </FilterToolbar>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary)]/30 font-semibold"
                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"
            }`}
          >
            {cat === "all" ? "Todas las Especialidades" : cat}
          </button>
        ))}
      </div>

      {/* Services Table / Cards List */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs">
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-[var(--surface-subtle)] text-[var(--muted)] flex items-center justify-center mx-auto mb-3 text-lg">
              🔍
            </div>
            <h3 className="text-sm font-bold text-[var(--foreground)]">
              No se encontraron servicios
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1 max-w-sm mx-auto">
              {search || selectedCategory !== "all"
                ? "Prueba cambiando los filtros o el término de búsqueda."
                : "Empieza creando el primer servicio odontológico de tu clínica."}
            </p>
            {!search && selectedCategory === "all" && (
              <Button
                onClick={handleCreate}
                variant="primary"
                className="mt-4 text-xs"
              >
                + Crear Primer Servicio
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted)] font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Código / Especialidad</th>
                  <th className="py-3 px-4">Servicio & Descripción</th>
                  <th className="py-3 px-4 text-center">Duración</th>
                  <th className="py-3 px-4 text-right">Precio Base</th>
                  <th className="py-3 px-4 text-right">Insumos / Lab</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredServices.map((s) => {
                  const suppliesCount = s.supplies?.length || 0;
                  const suppliesCost = (s.supplies || []).reduce(
                    (sum, sup) =>
                      sum + (sup.estimatedCost || 0) * (sup.quantity || 1),
                    0,
                  );
                  const totalDirectCost = (s.labCost || 0) + suppliesCost;

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[var(--surface-subtle)] transition-colors group"
                    >
                      {/* Code & Category */}
                      <td className="py-3 px-4 align-top">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono font-bold text-[11px] text-[var(--foreground)] bg-[var(--surface-subtle)] px-2 py-0.5 rounded border border-[var(--border)]">
                            {s.code || "S/C"}
                          </span>
                          <span className="text-[10px] text-[var(--muted)] font-medium">
                            {s.category || "General"}
                          </span>
                        </div>
                      </td>

                      {/* Name & Description */}
                      <td className="py-3 px-4 align-top max-w-xs">
                        <p className="font-semibold text-[var(--foreground)] text-xs group-hover:text-[var(--primary)] transition-colors">
                          {s.name}
                        </p>
                        {s.description && (
                          <p className="text-[11px] text-[var(--muted)] line-clamp-2 mt-0.5">
                            {s.description}
                          </p>
                        )}
                        {suppliesCount > 0 && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)]">
                              📦 {suppliesCount} insumo(s) asignado(s)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-4 align-top text-center">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--foreground)] bg-[var(--surface-subtle)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                          ⏱ {s.durationMin} min
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 align-top text-right">
                        <p className="font-bold text-[var(--foreground)] font-mono text-sm">
                          {formatCurrency(s.price)}
                        </p>
                      </td>

                      {/* Direct Costs */}
                      <td className="py-3 px-4 align-top text-right">
                        {totalDirectCost > 0 ? (
                          <div>
                            <p className="font-mono text-xs text-amber-600 dark:text-amber-400 font-semibold">
                              {formatCurrency(totalDirectCost)}
                            </p>
                            <p className="text-[10px] text-[var(--muted)]">
                              {s.labCost
                                ? `Lab: ${formatCurrency(s.labCost)}`
                                : "Insumos"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--muted)]">
                            —
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 align-top text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s.id)}
                          title="Clic para cambiar estado"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                            s.active
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800"
                              : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.active ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                          />
                          {s.active ? "Activo" : "Inactivo"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 rounded hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--primary)] transition-colors"
                            title="Editar servicio"
                          >
                            ✎
                          </button>
                          <button
                            onClick={() => setDeletingService(s)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-[var(--muted)] hover:text-red-600 transition-colors"
                            title="Eliminar servicio"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Service Form Modal (Create / Edit) */}
      <ServiceFormModal
        isOpen={isModalOpen}
        service={editingService}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Delete Confirmation Modal */}
      {deletingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 flex items-center justify-center text-lg font-bold flex-shrink-0">
                ⚠
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--foreground)]">
                  ¿Eliminar servicio?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Esta acción eliminará el servicio{" "}
                  <strong className="text-[var(--foreground)]">
                    &quot;{deletingService.name}&quot;
                  </strong>{" "}
                  y sus configuraciones de insumos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
              <Button
                variant="outline"
                onClick={() => setDeletingService(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
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
