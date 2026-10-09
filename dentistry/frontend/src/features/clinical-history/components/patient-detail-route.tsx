"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import PatientDetail from "@/modules/clinic/views/PatientDetail";

export function PatientDetailRoute({ patientId }: { patientId: string }) {
  const router = useRouter();
  return <><div className="px-4 md:px-8 py-3 border-b border-border bg-surface text-xs text-muted"><Link className="hover:text-primary" href="/patients">← Pacientes</Link><span className="mx-3">/</span>Detalle del paciente</div><PatientDetail patientId={patientId} initialTab="historial" onBack={() => router.push("/patients")} onNavigate={(view, params) => {
    if (view === "nueva-cita") router.push(`/agenda?patientId=${encodeURIComponent(patientId)}`);
    else if (view === "registrar-pago") router.push(`/register-payment?patientId=${encodeURIComponent(patientId)}`);
    else if (view === "cita-detalle" && params?.citaId) router.push(`/agenda?citaId=${encodeURIComponent(params.citaId)}`);
    else router.push("/patients");
  }} /></>;
}
