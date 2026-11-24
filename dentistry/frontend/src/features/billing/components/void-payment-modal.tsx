"use client";

import { useState } from "react";
import { Button, Icons, ResponsiveModal } from "@/shared/components/ui";
import { formatMinorCurrency } from "@/shared/utils/formatters";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import { useVoidPayment } from "@/features/billing/hooks/use-billing";
import type { Payment } from "@/features/billing/types/billing";

/** Anula un pago: el dinero vuelve al saldo y, si era de una atención, la libera. */
export function VoidPaymentModal({
  patientId,
  payment,
  onClose,
  onVoided,
}: {
  patientId: string;
  payment: Payment;
  onClose: () => void;
  onVoided: () => void;
}) {
  const voidPayment = useVoidPayment(patientId);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("El motivo de anulación es obligatorio.");
      return;
    }
    voidPayment.mutate(
      { paymentId: payment.id, reason: trimmed },
      {
        onSuccess: onVoided,
        onError: (cause) => setError(cause instanceof Error ? cause.message : "No se pudo anular el pago."),
      },
    );
  }

  return (
    <ResponsiveModal
      open
      onClose={() => {
        if (!voidPayment.isPending) onClose();
      }}
      title="Anular pago"
      description={`Se anulará el pago de ${formatMinorCurrency(payment.amountMinor, payment.currency)}. El importe vuelve al saldo del tratamiento.`}
      eyebrow="Anulación"
      icon={Icons.alertTriangle}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={voidPayment.isPending}>
            Volver
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={voidPayment.isPending} loading={voidPayment.isPending}>
            Anular pago
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextAreaField
          id="void-payment-reason"
          label="Motivo"
          value={reason}
          onChange={(value) => {
            setReason(value);
            setError(null);
          }}
        />
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
