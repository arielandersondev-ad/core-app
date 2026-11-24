"use client";

import { useState } from "react";
import { Button, Icons, Input, ResponsiveModal } from "@/shared/components/ui";
import { useCreateTreatment } from "@/features/billing/hooks/use-billing";
import type { Treatment } from "@/features/billing/types/billing";
import { MAX_TITLE_LENGTH, toCreateTreatmentInput, type TreatmentFormValues } from "@/features/billing/utils/forms";
import { DEFAULT_CURRENCY } from "@/features/billing/utils/money";

/** Alta de un tratamiento con su presupuesto (ej. Ortodoncia, 10 000 Bs). */
export function TreatmentModal({
  patientId,
  onClose,
  onCreated,
}: {
  patientId: string;
  onClose: () => void;
  onCreated: (treatment: Treatment) => void;
}) {
  const create = useCreateTreatment(patientId);
  const [values, setValues] = useState<TreatmentFormValues>({ title: "", budget: "", currency: DEFAULT_CURRENCY });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof TreatmentFormValues>(key: K, value: TreatmentFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  }

  function handleSubmit() {
    const result = toCreateTreatmentInput(values);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    create.mutate(result.input, {
      onSuccess: onCreated,
      onError: (cause) => setError(cause instanceof Error ? cause.message : "No se pudo crear el tratamiento."),
    });
  }

  return (
    <ResponsiveModal
      open
      onClose={() => {
        if (!create.isPending) onClose();
      }}
      title="Nuevo tratamiento"
      description="El presupuesto se puede definir ahora o más adelante; los abonos reducen el saldo."
      eyebrow="Presupuesto"
      icon={Icons.treatments}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={create.isPending} loading={create.isPending}>
            Crear tratamiento
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          id="treatment-title"
          label="Nombre"
          placeholder="Ej. Ortodoncia"
          maxLength={MAX_TITLE_LENGTH}
          value={values.title}
          onChange={(event) => update("title", event.target.value)}
          disabled={create.isPending}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
          <Input
            id="treatment-budget"
            label="Presupuesto (opcional)"
            inputMode="decimal"
            placeholder="Ej. 10000"
            value={values.budget}
            onChange={(event) => update("budget", event.target.value)}
            disabled={create.isPending}
          />
          <Input
            id="treatment-currency"
            label="Moneda"
            maxLength={3}
            value={values.currency}
            onChange={(event) => update("currency", event.target.value.toUpperCase())}
            disabled={create.isPending}
          />
        </div>
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
