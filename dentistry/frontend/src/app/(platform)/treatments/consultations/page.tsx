"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionTabs } from "@/shared/components/layout/section-tabs";
import { env } from "@/infrastructure/config/env";
import Consultations from "@/modules/clinic/views/Consultations";

function ConsultationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("patientId") ?? undefined;

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "paciente-detalle" && params?.patientId) {
      router.push(`/agenda?patientId=${params.patientId}`);
    }
  };

  return (
    <>
      <SectionTabs section="tratamientos" />
      <Consultations
        organizationId={env.organizationId}
        patientId={patientId}
        onNavigate={handleNavigate}
      />
    </>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Cargando consultas...
        </div>
      }
    >
      <ConsultationsContent />
    </Suspense>
  );
}
