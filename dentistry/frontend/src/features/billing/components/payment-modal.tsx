"use client";

import { useState, type ReactNode } from "react";
import { Button, Icons, Input, ResponsiveModal, Select } from "@/shared/components/ui";
import { formatMinorCurrency } from "@/shared/utils/formatters";
import type { PaymentMethod, RegisterPaymentInput } from "@/features/billing/types/billing";
import {
  paymentMethodOptions,
  toPaymentInput,
  type PaymentFormValues,
} from "@/features/billing/utils/forms";
import { DEFAULT_CURRENCY, minorToInputValue } from "@/features/billing/utils/money";

export interface PaymentModalProps {
  title: string;
  description: string;
  submitLabel?: string;
  /** Moneda del tratamiento, solo para mostrarla junto al importe. */
  currency: string | null;
  /** Saldo pendiente: tope del importe. */
  maxMinor: number | null;
  /** Monto sugerido (p. ej. la propuesta de la atención); editable. */
  initialAmountMinor?: number | null;
  /** Cobro sin tratamiento con presupuesto: se pide la moneda. */
  askCurrency?: boolean;
  /** Moneda inicial cuando se pide (p. ej. la de los precios de la atención). */
  defaultCurrency?: string;
  /** Sucursales a elegir cuando el usuario tiene varias y el cobro no hereda una. */
  branchOptions?: { value: string; label: string }[];
  /** Contenido previo a los campos (resumen, elección de tratamiento…). */
  header?: ReactNode;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: Omit<RegisterPaymentInput, "branchId"> & { branchId?: string }) => void;
}

/**
 * Formulario de cobro. Solo convierte lo escrito al contrato del backend; el
 * saldo, la moneda y el 1:1 con la atención los decide el backend.
 */
export function PaymentModal({
  title,
  description,
  submitLabel = "Registrar pago",
  currency,
  maxMinor,
  initialAmountMinor,
  askCurrency = false,
  defaultCurrency = DEFAULT_CURRENCY,
  branchOptions,
  header,
  submitting,
  error,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const needsBranch = (branchOptions?.length ?? 0) > 1;
  const [values, setValues] = useState<PaymentFormValues>(() => ({
    amount: initialAmountMinor ? minorToInputValue(initialAmountMinor) : "",
    method: "CASH",
    reference: "",
    notes: "",
    branchId: "",
    currency: defaultCurrency,
  }));
  const [validation, setValidation] = useState<string | null>(null);

  function update<K extends keyof PaymentFormValues>(key: K, value: PaymentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setValidation(null);
  }

  function handleSubmit() {
    const result = toPaymentInput(values, { maxMinor, askCurrency, needsBranch });
    if ("error" in result) {
      setValidation(result.error);
      return;
    }
    onSubmit(result.input);
  }

  const visibleError = error ?? validation;

  return (
    <ResponsiveModal
      open
      onClose={() => {
        if (!submitting) onClose();
      }}
      title={title}
      description={description}
      eyebrow="Cobro"
      icon={Icons.payments}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={submitting} loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {header}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="payment-amount"
            label={`Importe${currency ? ` (${currency})` : ""}`}
            inputMode="decimal"
            placeholder="Ej. 200"
            value={values.amount}
            onChange={(event) => update("amount", event.target.value)}
            hint={maxMinor !== null && currency ? `Saldo pendiente: ${formatMinorCurrency(maxMinor, currency)}` : undefined}
            disabled={submitting}
          />
          <Select
            id="payment-method"
            label="Medio de pago"
            value={values.method}
            onChange={(event) => update("method", event.target.value as PaymentMethod)}
            options={paymentMethodOptions}
            disabled={submitting}
          />
        </div>
        {askCurrency && (
          <Input
            id="payment-currency"
            label="Moneda"
            maxLength={3}
            value={values.currency}
            onChange={(event) => update("currency", event.target.value.toUpperCase())}
            hint="El cobro no está ligado a un tratamiento con presupuesto."
            disabled={submitting}
          />
        )}
        {needsBranch && (
          <Select
            id="payment-branch"
            label="Sucursal"
            value={values.branchId}
            onChange={(event) => update("branchId", event.target.value)}
            options={[{ value: "", label: "Selecciona una sucursal" }, ...(branchOptions ?? [])]}
            disabled={submitting}
          />
        )}
        <Input
          id="payment-reference"
          label="Referencia (opcional)"
          placeholder="Ej. N.º de recibo o de transferencia"
          maxLength={120}
          value={values.reference}
          onChange={(event) => update("reference", event.target.value)}
          disabled={submitting}
        />
        <Input
          id="payment-notes"
          label="Notas (opcional)"
          value={values.notes}
          onChange={(event) => update("notes", event.target.value)}
          disabled={submitting}
        />
        {visibleError && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {visibleError}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
