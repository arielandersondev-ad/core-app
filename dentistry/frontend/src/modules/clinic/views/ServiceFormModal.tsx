"use client";

import { useState, useEffect } from "react";
import {
  Service,
  ServiceSupply,
  formatCurrency,
} from "@/modules/clinic/__mocks__/data";
import { Button, Input, Select, Badge } from "@/shared/components/ui";
import { Icons } from "@/shared/components/ui/Icons";

const CATEGORIES = [
  "Preventiva",
  "Operatoria",
  "Endodoncia",
  "Cirugía",
  "Estética",
  "Ortodoncia",
  "Periodoncia",
  "Implantología",
  "Diagnóstico",
  "Urgencia",
  "General",
];

const COMMON_UNITS = [
  "unidades",
  "dosis",
  "ampollas",
  "tubos",
  "jeringas",
  "sobres",
  "paquetes",
  "cajas",
  "sets",
  "arcos",
  "módulos",
];

interface ServiceFormModalProps {
  isOpen: boolean;
  service?: Service | null;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void> | void;
}

export function ServiceFormModal({
  isOpen,
  service,
  onClose,
  onSave,
}: ServiceFormModalProps) {
  const isEdit = !!service;

  const [form, setForm] = useState({
    code: "",
    name: "",
    category: "General",
    durationMin: 30,
    price: 0,
    labCost: 0,
    description: "",
    active: true,
  });

  const [supplies, setSupplies] = useState<ServiceSupply[]>([]);
  const [newSupply, setNewSupply] = useState({
    name: "",
    quantity: 1,
    unit: "unidades",
    estimatedCost: 0,
  });

  const [activeTab, setActiveTab] = useState<"general" | "supplies">("general");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (service) {
      setForm({
        code: service.code || "",
        name: service.name || "",
        category: service.category || "General",
        durationMin: service.durationMin || 30,
        price: service.price || 0,
        labCost: service.labCost || 0,
        description: service.description || "",
        active: service.active ?? true,
      });
      setSupplies(service.supplies ? [...service.supplies] : []);
    } else {
      setForm({
        code: "",
        name: "",
        category: "Preventiva",
        durationMin: 30,
        price: 0,
        labCost: 0,
        description: "",
        active: true,
      });
      setSupplies([]);
    }
    setErrors({});
    setActiveTab("general");
  }, [service, isOpen]);

  if (!isOpen) return null;

  const totalSuppliesCost = supplies.reduce(
    (acc, s) => acc + (s.estimatedCost || 0) * (s.quantity || 1),
    0,
  );
  const totalCost = (form.labCost || 0) + totalSuppliesCost;
  const estimatedMargin = (form.price || 0) - totalCost;
  const marginPercentage =
    form.price > 0 ? Math.round((estimatedMargin / form.price) * 100) : 0;

  const handleAddSupply = () => {
    if (!newSupply.name.trim()) return;
    setSupplies([
      ...supplies,
      {
        id: `sup-${Date.now()}`,
        name: newSupply.name.trim(),
        quantity: Math.max(1, Number(newSupply.quantity) || 1),
        unit: newSupply.unit || "unidades",
        estimatedCost: Math.max(0, Number(newSupply.estimatedCost) || 0),
      },
    ]);
    setNewSupply({ name: "", quantity: 1, unit: "unidades", estimatedCost: 0 });
  };

  const handleRemoveSupply = (index: number) => {
    setSupplies(supplies.filter((_, i) => i !== index));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "El nombre del servicio es obligatorio";
    if (form.durationMin < 5) e.durationMin = "La duración mínima es 5 minutos";
    if (form.price < 0) e.price = "El precio no puede ser negativo";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setActiveTab("general");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...form,
        supplies,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
              {isEdit ? "✎" : "+"}
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {isEdit
                  ? "Editar Servicio Odontológico"
                  : "Nuevo Servicio Odontológico"}
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Configura los parámetros clínicos, costos y suministros
                requeridos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[var(--surface-hover)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-base font-bold leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-6 bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === "general"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Información General & Precios
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("supplies")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === "supplies"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            Insumos & Costos
            {supplies.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-bold flex items-center justify-center">
                {supplies.length}
              </span>
            )}
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-5"
        >
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Nombre del Servicio *
                  </label>
                  <Input
                    placeholder="Ej. Resina Estética Fotocurable"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setErrors({ ...errors, name: "" });
                    }}
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-[11px] text-red-500 mt-1">
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Código Interno
                  </label>
                  <Input
                    placeholder="Ej. OPER-01"
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Especialidad / Categoría
                  </label>
                  <Select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Duración Estimada (Minutos) *
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step={5}
                      min={5}
                      max={480}
                      value={form.durationMin}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          durationMin: Math.max(
                            5,
                            parseInt(e.target.value) || 30,
                          ),
                        })
                      }
                      className="w-28"
                    />
                    <span className="text-xs text-[var(--muted)]">min</span>
                    <div className="flex gap-1 ml-auto">
                      {[15, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, durationMin: mins })
                          }
                          className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                            form.durationMin === mins
                              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                              : "bg-[var(--surface-subtle)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Precio Base al Paciente (Bs.) *
                  </label>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                    Costo Estimado de Laboratorio (Bs.)
                  </label>
                  <Input
                    type="number"
                    step={1}
                    min={0}
                    placeholder="0"
                    value={form.labCost}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        labCost: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                  Descripción Clínica & Indicaciones
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detalles clínicos del procedimiento, protocolo o notas para la agenda..."
                  className="w-full text-xs rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-md">
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground)]">
                    Estado del Servicio
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {form.active
                      ? "Disponible para agendar citas y generar presupuestos"
                      : "Oculto para nuevas citas (los registros históricos se preservan)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    form.active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-300"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-300"
                  }`}
                >
                  {form.active ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "supplies" && (
            <div className="space-y-4">
              {/* Cost Summary Box */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-md">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Precio Sugerido
                  </p>
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {formatCurrency(form.price)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Costos Directos
                  </p>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(totalCost)}
                    <span className="text-[10px] text-[var(--muted)] font-normal ml-1">
                      (Lab: {formatCurrency(form.labCost)})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                    Margen Estimado
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      estimatedMargin >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500"
                    }`}
                  >
                    {formatCurrency(estimatedMargin)}{" "}
                    <span className="text-[10px] font-normal">
                      ({marginPercentage}%)
                    </span>
                  </p>
                </div>
              </div>

              {/* Add Supply Inline */}
              <div className="p-3.5 border border-[var(--border)] rounded-md bg-[var(--surface)] flex flex-col gap-2.5">
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Asociar Material o Insumo Requerido
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <Input
                      placeholder="Nombre del insumo (ej. Resina A2, Anestesia)"
                      value={newSupply.name}
                      onChange={(e) =>
                        setNewSupply({ ...newSupply, name: e.target.value })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={1}
                      placeholder="Cant."
                      value={newSupply.quantity}
                      onChange={(e) =>
                        setNewSupply({
                          ...newSupply,
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Select
                      value={newSupply.unit}
                      onChange={(e) =>
                        setNewSupply({ ...newSupply, unit: e.target.value })
                      }
                      className="text-xs"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Costo Bs."
                      value={newSupply.estimatedCost || ""}
                      onChange={(e) =>
                        setNewSupply({
                          ...newSupply,
                          estimatedCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleAddSupply}
                      className="w-full h-full text-xs font-bold flex items-center justify-center p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>

              {/* Supplies List */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Insumos Registrados ({supplies.length})
                </p>
                {supplies.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-md text-[var(--muted)] text-xs">
                    No se han configurado insumos para este servicio.
                  </div>
                ) : (
                  <div className="border border-[var(--border)] rounded-md divide-y divide-[var(--border)] overflow-hidden">
                    {supplies.map((s, idx) => (
                      <div
                        key={s.id || idx}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-[var(--surface-subtle)]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                          <span className="font-medium text-[var(--foreground)]">
                            {s.name}
                          </span>
                          <span className="text-[var(--muted)]">
                            ({s.quantity} {s.unit})
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[var(--foreground)]">
                            {formatCurrency(
                              (s.estimatedCost || 0) * (s.quantity || 1),
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSupply(idx)}
                            className="text-red-500 hover:text-red-700 text-sm font-bold p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <div className="flex items-center gap-2">
              {activeTab === "general" ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("supplies")}
                >
                  Siguiente: Insumos →
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("general")}
                >
                  ← Volver a General
                </Button>
              )}
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : isEdit
                    ? "Actualizar Servicio"
                    : "Crear Servicio"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
