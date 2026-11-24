"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { encounterReferenceDataOptions } from "@/features/clinical-encounter/api/query-options";
import { PaymentModal } from "@/features/billing/components/payment-modal";
import { useRegisterTreatmentPayment } from "@/features/billing/hooks/use-billing";
import type { Payment, Treatment } from "@/features/billing/types/billing";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";

/** Abono a un tratamiento (reduce su saldo). Lo usan la cuenta y el detalle del paciente. */
export function TreatmentPaymentDialog({
  patientId,
  treatment,
  onClose,
  onRegistered,
}: {
  patientId: string;
  treatment: Treatment;
  onClose: () => void;
  onRegistered: (payment: Payment) => void;
}) {
  const session = useAuthenticatedSession();
  const branchIds = session.context.branchIds;
  const register = useRegisterTreatmentPayment(patientId);
  // Los nombres de sucursal solo hacen falta si hay varias para elegir.
  const reference = useQuery({ ...encounterReferenceDataOptions(patientId), enabled: branchIds.length > 1 });
  const [error, setError] = useState<string | null>(null);

  const branchOptions = branchIds.map((id, index) => ({
    value: id,
    label: reference.data?.branches.find((branch) => branch.id === id)?.label ?? `Sucursal ${index + 1}`,
  }));

  return (
    <PaymentModal
      title="Registrar abono"
      description={`Abono a «${treatment.title ?? "tratamiento"}». Reduce el saldo del tratamiento.`}
      currency={treatment.currency}
      maxMinor={treatment.balanceMinor}
      branchOptions={branchOptions}
      submitting={register.isPending}
      error={error}
      onClose={onClose}
      onSubmit={(input) =>
        register.mutate(
          { treatmentId: treatment.id, input },
          {
            onSuccess: onRegistered,
            onError: (cause) => setError(cause instanceof Error ? cause.message : "No se pudo registrar el pago."),
          },
        )
      }
    />
  );
}
