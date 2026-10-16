"use client";

import { useState, useEffect } from "react";
import {
  patients,
  services,
  professionals,
  payments,
  Payment,
  PaymentMethod,
  PaymentStatus,
  formatCurrency,
} from "@/modules/clinic/__mocks__/data";
import { Modal, Button, Input, Select, Icons } from "@/shared/components/ui";

interface RegisterPaymentModalProps {
  open: boolean;
  initialPatientId?: string;
  initialAmount?: number;
  initialServiceId?: string;
  initialConcept?: string;
  onClose: () => void;
  onSuccess?: (payment: Payment) => void;
}

export function RegisterPaymentModal({
  open,
  initialPatientId,
  initialAmount,
  initialServiceId,
  initialConcept,
  onClose,
  onSuccess,
}: RegisterPaymentModalProps) {
  const [form, setForm] = useState({
    patientId: initialPatientId || "",
    serviceId: initialServiceId || "",
    professionalId: professionals[0]?.id || "",
    amount: initialAmount ? String(initialAmount) : "",
    date: new Date().toISOString().split("T")[0],
    method: "efectivo" as PaymentMethod,
    status: "pagado" as PaymentStatus,
    concept: initialConcept || "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm((prev) => ({
        ...prev,
        patientId: initialPatientId || prev.patientId || (patients[0]?.id ?? ""),
        amount: initialAmount !== undefined ? String(initialAmount) : prev.amount,
        serviceId: initialServiceId || prev.serviceId,
        concept: initialConcept || prev.concept,
        date: new Date().toISOString().split("T")[0],
      }));
      setError("");
    }
  }, [open, initialPatientId, initialAmount, initialServiceId, initialConcept]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");

    // Auto-update amount and concept if service changed
    if (field === "serviceId" && value) {
      const s = services.find((srv) => srv.id === value);
      if (s) {
        setForm((prev) => ({
          ...prev,
          serviceId: value,
          amount: String(s.price),
          concept: prev.concept || s.name,
        }));
      }
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!form.patientId) {
      setError("Selecciona un paciente");
      return;
    }
    const parsedAmount = parseFloat(form.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Ingresa un monto numérico válido mayor a 0");
      return;
    }

    setIsSubmitting(true);
    const newPayment: Payment = {
      id: `pag-${Date.now()}`,
      patientId: form.patientId,
      serviceId: form.serviceId || undefined,
      appointmentId: undefined,
      amount: parsedAmount,
      date: form.date,
      method: form.method,
      status: form.status,
      concept: form.concept.trim() || "Cobro de atención odontológica",
      notes: `Registrado para: ${
        professionals.find((p) => p.id === form.professionalId)?.name || "Clínica"
      }`,
    };

    payments.unshift(newPayment);
    setIsSubmitting(false);

    if (onSuccess) {
      onSuccess(newPayment);
    }
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Registrar Cobro"
      subtitle="Generar comprobante de pago por atención o insumos"
      icon={Icons.dollarSign}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Paciente y Concepto */}
        <div>
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            1. Paciente & Tratamiento
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Paciente *
              </label>
              <Select
                value={form.patientId}
                onChange={(e) => handleChange("patientId", e.target.value)}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.phone})`,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Tratamiento Relacionado
              </label>
              <Select
                value={form.serviceId}
                onChange={(e) => handleChange("serviceId", e.target.value)}
                options={[
                  { value: "", label: "Ninguno / Otro concepto" },
                  ...services.map((s) => ({
                    value: s.id,
                    label: `${s.name} (${formatCurrency(s.price)})`,
                  })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Profesional Tratante
              </label>
              <Select
                value={form.professionalId}
                onChange={(e) => handleChange("professionalId", e.target.value)}
                options={professionals.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
              />
            </div>
          </div>
        </div>

        {/* Monto y Método */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <h3 className="text-[11px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-3">
            2. Importe & Transacción
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Monto (Bs.) *
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Método de Pago
              </label>
              <Select
                value={form.method}
                onChange={(e) => handleChange("method", e.target.value as PaymentMethod)}
                options={[
                  { value: "efectivo", label: "Efectivo" },
                  { value: "tarjeta", label: "Tarjeta de Débito/Crédito" },
                  { value: "transferencia", label: "Transferencia / QR" },
                  { value: "otro", label: "Otro" },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
                Estado del Cobro
              </label>
              <Select
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value as PaymentStatus)}
                options={[
                  { value: "pagado", label: "Pagado (Total)" },
                  { value: "pendiente", label: "Pendiente" },
                  { value: "parcial", label: "Abono Parcial" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Concepto adicional */}
        <div className="pt-2 border-t border-[var(--border)]/60">
          <label className="block text-xs font-semibold text-[var(--foreground)] mb-1">
            Concepto o Glosa del Recibo
          </label>
          <Input
            placeholder="Ej. Pago primera sesión de endodoncia pieza 14"
            value={form.concept}
            onChange={(e) => handleChange("concept", e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Footer */}
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
            {isSubmitting ? "Registrando..." : "Registrar Cobro"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
