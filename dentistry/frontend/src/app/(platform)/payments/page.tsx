"use client";

import { useRouter } from "next/navigation";
import Payments from "@/modules/clinic/views/Payments";

export default function PaymentsPage() {
  const router = useRouter();

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "registrar-pago") {
      router.push(
        params?.patientId
          ? `/register-payment?patientId=${params.patientId}`
          : "/register-payment",
      );
    }
  };

  return <Payments onNavigate={handleNavigate} />;
}
