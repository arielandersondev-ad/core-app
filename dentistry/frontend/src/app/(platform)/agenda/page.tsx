"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Agenda from "@/modules/clinic/views/Agenda";
import CreateAppointment from "@/modules/clinic/views/CreateAppointment";
import AppointmentDetail from "@/modules/clinic/views/AppointmentDetail";
import PatientDetail from "@/modules/clinic/views/PatientDetail";

type AgendaSubView =
  | "agenda"
  | "nueva-cita"
  | "cita-detalle"
  | "paciente-detalle";

function AgendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCitaId = searchParams.get("citaId");
  const initialPatientId = searchParams.get("patientId");

  const [subView, setSubView] = useState<AgendaSubView>(
    initialCitaId
      ? "cita-detalle"
      : initialPatientId
        ? "paciente-detalle"
        : "agenda",
  );
  const [selectedCitaId, setSelectedCitaId] = useState<string | undefined>(
    initialCitaId || undefined,
  );
  const [selectedPatientId, setSelectedPatientId] = useState<
    string | undefined
  >(initialPatientId || undefined);

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
    } else if (view === "registrar-pago") {
      router.push(
        params?.patientId
          ? `/register-payment?patientId=${params.patientId}`
          : "/register-payment",
      );
    } else {
      setSubView("agenda");
    }
  };

  const getSubViewLabel = () => {
    switch (subView) {
      case "nueva-cita":
        return "Nueva Cita";
      case "cita-detalle":
        return "Detalle de Cita";
      case "paciente-detalle":
        return "Perfil de Paciente";
      default:
        return "Agenda";
    }
  };

  return (
    <div className="flex flex-col h-full">
      {subView !== "agenda" && (
        <div className="flex items-center gap-2 px-4 md:px-6 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] text-xs font-mono">
          <button
            onClick={() => setSubView("agenda")}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            ← Volver a la Agenda
          </button>
          <span className="text-[var(--muted)]">/</span>
          <span className="text-[var(--foreground)] font-semibold">
            {getSubViewLabel()}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
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
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Cargando agenda...
        </div>
      }
    >
      <AgendaContent />
    </Suspense>
  );
}
