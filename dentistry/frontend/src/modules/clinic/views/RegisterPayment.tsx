"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  patients,
  services,
  professionals,
  payments,
  formatCurrency,
} from "@/modules/clinic/__mocks__/data";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Input, Select, Button } from "@/shared/components/ui";

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "otro";
type PaymentStatus = "pagado" | "pendiente" | "parcial";

interface RegisterPaymentProps {
  initialPatientId?: string;
  initialAmount?: string;
}

export default function RegisterPayment({
  initialPatientId = "",
  initialAmount = "",
}: RegisterPaymentProps = {}) {
  const router = useRouter();
  const [form, setForm] = useState({
    patientId: initialPatientId,
    serviceId: "",
    professionalId: "",
    amount: initialAmount,
    date: new Date().toISOString().split("T")[0],
    method: "efectivo" as PaymentMethod,
    status: "pagado" as PaymentStatus,
    concept: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  };

  const handleSubmit = () => {
    if (!form.patientId) {
      setError("Selecciona un paciente");
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    // Crear nuevo pago
    const newPayment = {
      id: `pag-${Date.now()}`,
      patientId: form.patientId,
      serviceId: form.serviceId || undefined,
      appointmentId: undefined,
      amount: parseFloat(form.amount),
      date: form.date,
      method: form.method,
      status: form.status,
      concept: form.concept || "Pago registrado",
      notes: `Profesional: ${
        professionals.find((p) => p.id === form.professionalId)?.name ||
        "No asignado"
      }`,
    };

    payments.push(newPayment);

    setSuccess(true);
    setTimeout(() => {
      router.push("/payments");
    }, 1500);
  };

  if (success) {
    return (
      <PageContainer maxWidth="max-w-md" className="pt-20 items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl shadow-xs">
          ✓
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-bold text-[var(--foreground)]">
            Pago registrado
          </h3>
          <p className="text-sm text-[var(--muted)]">
            El pago de <strong>{formatCurrency(parseFloat(form.amount))}</strong> ha sido registrado con éxito.
          </p>
        </div>
        <Button onClick={() => router.push("/payments")} fullWidth className="mt-4 shadow-xs">
          Volver a pagos
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="max-w-2xl">
      {/* 1. Cabecera */}
      <PageHeader
        title="Registrar Pago"
        description="Ingresa los datos de la transacción, método de pago y estado de cobro"
        breadcrumbs={[
          { label: "Pagos", onClick: () => router.push("/payments") },
          { label: "Registrar pago" },
        ]}
      />

      {error && (
        <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl text-sm text-[var(--danger)] dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {/* 2. Tarjeta de Formulario */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
        {/* Paciente */}
        <Select
          label="Paciente *"
          value={form.patientId}
          onChange={(e) => handleChange("patientId", e.target.value)}
        >
          <option value="">Seleccionar paciente…</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        {/* Servicio (opcional) */}
        <Select
          label="Servicio / Tratamiento (opcional)"
          value={form.serviceId}
          onChange={(e) => handleChange("serviceId", e.target.value)}
        >
          <option value="">Sin servicio asociado</option>
          {services
            .filter((s) => s.active)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} - {formatCurrency(s.price)}
              </option>
            ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Monto */}
          <Input
            label="Monto (S/.) *"
            type="number"
            step="0.01"
            min="0.01"
            value={form.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="0.00"
          />

          {/* Fecha */}
          <Input
            label="Fecha *"
            type="date"
            value={form.date}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Método de pago */}
          <Select
            label="Método de pago *"
            value={form.method}
            onChange={(e) =>
              handleChange("method", e.target.value as PaymentMethod)
            }
          >
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
            <option value="otro">Otro</option>
          </Select>

          {/* Estado */}
          <Select
            label="Estado *"
            value={form.status}
            onChange={(e) =>
              handleChange("status", e.target.value as PaymentStatus)
            }
          >
            <option value="pagado">Pagado</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
          </Select>
        </div>

        {/* Profesional (opcional) */}
        <Select
          label="Profesional que atendió (opcional)"
          value={form.professionalId}
          onChange={(e) => handleChange("professionalId", e.target.value)}
        >
          <option value="">No asignado</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} - {p.specialty}
            </option>
          ))}
        </Select>

        {/* Concepto (opcional) */}
        <Input
          label="Concepto / Glosa (opcional)"
          type="text"
          value={form.concept}
          onChange={(e) => handleChange("concept", e.target.value)}
          placeholder="Ej. Abono por tratamiento de ortodoncia"
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-3 mt-2 border-t border-[var(--border)]">
          <Button
            onClick={handleSubmit}
            className="flex-1 shadow-xs"
          >
            Registrar pago
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
