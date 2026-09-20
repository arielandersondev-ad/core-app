"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Patients from "@/modules/clinic/views/Patients";
import CreatePatient from "@/modules/clinic/views/CreatePatient";
import PatientDetail from "@/modules/clinic/views/PatientDetail";

type PatientSubView = "list" | "crear-paciente" | "paciente-detalle";

function PatientsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPatientId = searchParams.get("patientId");
  const initialCreate = searchParams.get("create") === "true";

  const [subView, setSubView] = useState<PatientSubView>(
    initialCreate
      ? "crear-paciente"
      : initialPatientId
        ? "paciente-detalle"
        : "list",
  );
  const [selectedPatientId, setSelectedPatientId] = useState<
    string | undefined
  >(initialPatientId || undefined);

  const handleNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "crear-paciente") {
      setSubView("crear-paciente");
    } else if (view === "paciente-detalle" && params?.patientId) {
      setSelectedPatientId(params.patientId);
      setSubView("paciente-detalle");
    } else if (view === "cita-detalle" && params?.citaId) {
      router.push(`/agenda?citaId=${params.citaId}`);
    } else if (view === "nueva-cita") {
      router.push(
        params?.patientId ? `/agenda?patientId=${params.patientId}` : "/agenda",
      );
    } else if (view === "registrar-pago" && params?.patientId) {
      router.push(`/register-payment?patientId=${params.patientId}`);
    } else {
      setSubView("list");
    }
  };

  return (
    <div className="flex flex-col h-full">
      {subView !== "list" && (
        <div className="flex items-center gap-2 px-4 md:px-6 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] text-xs font-mono">
          <button
            onClick={() => setSubView("list")}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
          >
            ← Volver a Pacientes
          </button>
          <span className="text-[var(--muted)]">/</span>
          <span className="text-[var(--foreground)] font-semibold">
            {subView === "crear-paciente"
              ? "Nuevo Paciente"
              : "Perfil de Paciente"}
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {subView === "list" && <Patients onNavigate={handleNavigate} />}
        {subView === "crear-paciente" && (
          <CreatePatient onBack={() => setSubView("list")} />
        )}
        {subView === "paciente-detalle" && selectedPatientId && (
          <PatientDetail
            patientId={selectedPatientId}
            onBack={() => setSubView("list")}
            onNavigate={handleNavigate}
          />
        )}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-[var(--muted)]">
          Cargando pacientes...
        </div>
      }
    >
      <PatientsContent />
    </Suspense>
  );
}
