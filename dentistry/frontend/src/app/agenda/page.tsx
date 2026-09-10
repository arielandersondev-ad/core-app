"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/infrastructure/hooks/useTheme";
import ClinicLayout, { ClinicTab } from "@/shared/layouts/ClinicLayout";
import Agenda from "@/modules/clinic/views/Agenda";
import CreateAppointment from "@/modules/clinic/views/CreateAppointment";
import AppointmentDetail from "@/modules/clinic/views/AppointmentDetail";
import PatientDetail from "@/modules/clinic/views/PatientDetail";

type AgendaSubView =
  | "agenda"
  | "nueva-cita"
  | "cita-detalle"
  | "paciente-detalle";

export default function AgendaPage() {
  const router = useRouter();
  const { dark, toggleDark } = useTheme();
  const [subView, setSubView] = useState<AgendaSubView>("agenda");
  const [selectedCitaId, setSelectedCitaId] = useState<string | undefined>();
  const [selectedPatientId, setSelectedPatientId] = useState<
    string | undefined
  >();

  const handleTabChange = (tab: ClinicTab) => {
    const routes: Record<ClinicTab, string> = {
      dashboard: "/",
      pacientes: "/patients",
      agenda: "/agenda",
      tratamientos: "/treatments",
      pagos: "/payments",
      inventario: "/inventory",
    };
    router.push(routes[tab] || "/");
  };

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "nueva-cita") {
      setSelectedPatientId(params?.patientId);
      setSubView("nueva-cita");
    } else if (view === "cita-detalle" && params?.citaId) {
      setSelectedCitaId(params.citaId);
      setSubView("cita-detalle");
    } else if (view === "paciente-detalle" && params?.patientId) {
      setSelectedPatientId(params.patientId);
      setSubView("paciente-detalle");
    } else if (view === "registrar-pago" && params?.patientId) {
      router.push(`/register-payment?patientId=${params.patientId}`);
    } else {
      setSubView("agenda");
    }
  };

  const getBreadcrumbs = () => {
    const base = [{ label: "Agenda", onClick: () => setSubView("agenda") }];
    if (subView === "nueva-cita") {
      return [...base, { label: "Nueva Cita" }];
    }
    if (subView === "cita-detalle") {
      return [...base, { label: "Detalle de Cita" }];
    }
    if (subView === "paciente-detalle") {
      return [...base, { label: "Perfil de Paciente" }];
    }
    return [{ label: "Agenda de Citas" }];
  };

  return (
    <ClinicLayout
      activeTab="agenda"
      onTabChange={handleTabChange}
      dark={dark}
      onToggleDark={toggleDark}
      onSwitchApp={() => router.push("/")}
      title="Agenda"
      breadcrumbs={getBreadcrumbs()}
      canGoBack={subView !== "agenda"}
      onBack={() => setSubView("agenda")}
    >
      {subView === "agenda" && <Agenda onNavigate={handleNavigate} />}
      {subView === "nueva-cita" && (
        <CreateAppointment
          patientId={selectedPatientId}
          onBack={() => setSubView("agenda")}
        />
      )}
      {subView === "cita-detalle" && selectedCitaId && (
        <AppointmentDetail
          citaId={selectedCitaId}
          onNavigate={handleNavigate}
        />
      )}
      {subView === "paciente-detalle" && selectedPatientId && (
        <PatientDetail
          patientId={selectedPatientId}
          onBack={() => setSubView("agenda")}
          onNavigate={handleNavigate}
        />
      )}
    </ClinicLayout>
  );
}
