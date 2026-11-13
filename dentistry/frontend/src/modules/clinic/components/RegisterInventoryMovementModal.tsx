"use client";

import { useState } from "react";

import {
  inventoryMovements,
  professionals,
  InventoryItem,
  InventoryMovement,
  InventoryMovementType,
} from "@/modules/clinic/__mocks__/data";
import { Modal, Button, Input, Select, Icons } from "@/shared/components/ui";

interface RegisterInventoryMovementModalProps {
  open: boolean;
  onClose: () => void;
  items: InventoryItem[];
  defaultItemId?: string;
  onSuccess?: (movement: InventoryMovement) => void;
}

export function RegisterInventoryMovementModal({
  open,
  onClose,
  items,
  defaultItemId,
  onSuccess,
}: RegisterInventoryMovementModalProps) {
  const [itemId, setItemId] = useState(
    defaultItemId ?? items[0]?.id ?? "",
  );
  const [type, setType] =
    useState<InventoryMovementType>("IN");
  const [quantity, setQuantity] = useState("");
  const [adjustmentDirection, setAdjustmentDirection] =
    useState<"add" | "subtract">("add");
  const [reason, setReason] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedItem = items.find((item) => item.id === itemId);

  const reset = () => {
    setItemId(defaultItemId ?? items[0]?.id ?? "");
    setType("IN");
    setQuantity("");
    setAdjustmentDirection("add");
    setReason("");
    setProfessionalId("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (!selectedItem) {
      setError("Selecciona un artículo");
      return;
    }

    const absolute = Number(quantity);

    if (!Number.isInteger(absolute) || absolute <= 0) {
      setError("Ingresa una cantidad entera mayor que cero");
      return;
    }

    const signed =
      type === "ADJUSTMENT"
        ? adjustmentDirection === "subtract"
          ? -absolute
          : absolute
        : type === "OUT"
          ? -absolute
          : absolute;

    if (selectedItem.stock + signed < 0) {
      setError(
        `Stock insuficiente: hay ${selectedItem.stock} ${selectedItem.unit}`,
      );
      return;
    }

    setIsSubmitting(true);

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      itemId: selectedItem.id,
      type,
      quantity:
        type === "ADJUSTMENT" ? signed : absolute,
      occurredAt: new Date().toISOString().slice(0, 10),
      reason:
        reason.trim() ||
        (type === "IN"
          ? "Entrada manual"
          : type === "OUT"
            ? "Salida manual"
            : "Ajuste manual"),
      professionalId: professionalId || undefined,
    };

    inventoryMovements.unshift(movement);

    setIsSubmitting(false);
    onSuccess?.(movement);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar movimiento"
      subtitle="Entrada, salida o ajuste de existencias"
      icon={Icons.branch}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Artículo *
          </label>
          <Select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            options={items.map((item) => ({
              value: item.id,
              label: `${item.name} — ${item.stock} ${item.unit}`,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Tipo de movimiento *
            </label>
            <Select
              value={type}
              onChange={(e) =>
                setType(e.target.value as InventoryMovementType)
              }
              options={[
                { value: "IN", label: "Entrada" },
                { value: "OUT", label: "Salida" },
                { value: "ADJUSTMENT", label: "Ajuste" },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Cantidad *
            </label>
            <Input
              type="number"
              min={1}
              step={1}
              placeholder="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        {type === "ADJUSTMENT" && (
          <div>
            <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
              Dirección del ajuste
            </label>
            <Select
              value={adjustmentDirection}
              onChange={(e) =>
                setAdjustmentDirection(
                  e.target.value as "add" | "subtract",
                )
              }
              options={[
                { value: "add", label: "Sumar existencias" },
                { value: "subtract", label: "Restar existencias" },
              ]}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Motivo
          </label>
          <Input
            placeholder="Ej. Compra mensual, merma, consumo en tratamiento…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Responsable
          </label>
          <Select
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            options={[
              { value: "", label: "Sin especificar" },
              ...professionals.map((professional) => ({
                value: professional.id,
                label: professional.name,
              })),
            ]}
          />
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
            {isSubmitting ? "Guardando..." : "Guardar movimiento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
