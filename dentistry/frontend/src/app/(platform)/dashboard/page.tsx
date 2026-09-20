"use client";

import { useRouter } from "next/navigation";
import ClinicDashboard from "@/modules/clinic/views/ClinicDashboard";

export default function DashboardPage() {
  const router = useRouter();

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "agenda") {
      router.push("/agenda");
    } else if (view === "crear-paciente") {
      router.push("/patients?create=true");
    } else if (view === "pacientes") {
      router.push("/patients");
    } else if (view === "cita-detalle" && params?.citaId) {
      router.push(`/agenda?citaId=${params.citaId}`);
    } else if (view === "paciente-detalle" && params?.patientId) {
      router.push(`/patients?patientId=${params.patientId}`);
    } else if (view === "inventario") {
      router.push("/inventory");
    } else if (view === "registrar-pago") {
      router.push(
        params?.patientId
          ? `/register-payment?patientId=${params.patientId}`
          : "/register-payment",
      );
    }
  };

  return <ClinicDashboard onNavigate={handleNavigate} />;
}
