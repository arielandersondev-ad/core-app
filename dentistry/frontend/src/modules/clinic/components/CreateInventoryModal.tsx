"use client";

import { useState } from "react";
import { inventory, InventoryItem } from "@/modules/clinic/__mocks__/data";
import { Modal, Button, Input, Select, Icons } from "@/shared/components/ui";

interface CreateInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (item: InventoryItem) => void;
}

export function CreateInventoryModal({
  open,
  onClose,
  onSuccess,
}: CreateInventoryModalProps) {
  const [form, setForm] = useState({
    name: "",
    category: "Materiales Dentales",
    unit: "unidades",
    stock: "",
    minStock: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (error) setError("");
  };

  const handleClose = () => {
    setForm({
      name: "",
      category: "Materiales Dentales",
      unit: "unidades",
      stock: "",
      minStock: "",
    });
    setError("");
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.name.trim()) {
      setError("Ingresa el nombre del insumo o material");
      return;
    }
    const currentStock = parseInt(form.stock, 10);
    const minAlertStock = parseInt(form.minStock, 10);
    if (isNaN(currentStock) || currentStock < 0) {
      setError("Ingresa una cantidad de stock válida (0 o superior)");
      return;
    }
    if (isNaN(minAlertStock) || minAlertStock < 0) {
      setError("Ingresa un stock mínimo de alerta válido");
      return;
    }

    setIsSubmitting(true);
    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: form.name.trim(),
      category: form.category,
      unit: form.unit,
      stock: currentStock,
      minStock: minAlertStock,
      lastRefill: new Date().toISOString().split("T")[0],
    };

    inventory.unshift(newItem);
    setIsSubmitting(false);

    if (onSuccess) {
      onSuccess(newItem);
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nuevo Insumo / Material"
      subtitle="Registrar nuevo artículo en el catálogo de existencias"
      icon={Icons.branch}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Nombre del Insumo / Material *
          </label>
          <Input
            placeholder="Ej. Resina Compuesta A2, Guantes de Látex..."
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Categoría
            </label>
            <Select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              options={[
                { value: "Materiales Dentales", label: "Materiales Dentales" },
                { value: "Bioseguridad", label: "Bioseguridad" },
                { value: "Instrumental", label: "Instrumental" },
                { value: "Ortodoncia", label: "Ortodoncia" },
                { value: "Quirúrgico", label: "Quirúrgico" },
                { value: "Anestésicos", label: "Anestésicos" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Unidad de Medida
            </label>
            <Select
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              options={[
                { value: "unidades", label: "Unidades (u)" },
                { value: "cajas", label: "Cajas" },
                { value: "frascos", label: "Frascos / Tubos" },
                { value: "paquetes", label: "Paquetes" },
                { value: "rollos", label: "Rollos" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]/60">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Stock Inicial Disponible *
            </label>
            <Input
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={(e) => set("stock", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Stock Mínimo (Alerta) *
            </label>
            <Input
              type="number"
              placeholder="5"
              value={form.minStock}
              onChange={(e) => set("minStock", e.target.value)}
            />
            <p className="text-[10px] text-[var(--muted)] mt-1">
              Generará alerta si la existencia cae por debajo de este valor.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="rounded-xl shadow-xs"
          >
            {isSubmitting ? "Guardando..." : "Guardar Insumo"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
