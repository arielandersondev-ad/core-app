"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RegisterPayment from "@/modules/clinic/views/RegisterPayment";

function RegisterPaymentContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") || "";
  const amount = searchParams.get("amount") || "";

  return (
    <RegisterPayment initialPatientId={patientId} initialAmount={amount} />
  );
}

export default function RegisterPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Cargando formulario de pago...
        </div>
      }
    >
      <RegisterPaymentContent />
    </Suspense>
  );
}
