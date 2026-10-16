"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Patients from "@/modules/clinic/views/Patients";
import PatientDetail from "@/modules/clinic/views/PatientDetail";
import CreatePatient from "@/modules/clinic/views/CreatePatient";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";
import { NAV_ITEMS } from "@/shared/components/layout/navigation";
import { Icons } from "@/shared/components/icons/icons";
import { patients } from "@/modules/clinic/__mocks__/data";

const initialPatientIds = new Set(patients.map((patient) => patient.id));

export function ClinicalDemo({ patientId }: { patientId?: string }) {
  const router = useRouter();
  const [create, setCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionPatientId, setSessionPatientId] = useState<string>();
  const selectedPatientId = sessionPatientId || patientId;
  const onNavigate = (view: string, params?: Record<string, string>) => {
    if (view === "paciente-detalle" && params?.patientId) {
      if (initialPatientIds.has(params.patientId)) router.push(`/clinical-history-demo?patientId=${encodeURIComponent(params.patientId)}`);
      else setSessionPatientId(params.patientId);
    }
    else if (view === "crear-paciente") setCreate(true);
    else setMessage("Esta vista previa está centrada en el historial clínico. Las citas y los pagos se abren desde el módulo autenticado.");
  };
  return <div className="flex h-dvh bg-background">
    <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-border bg-surface"><div className="h-14 flex items-center px-5 gap-2.5 border-b border-border"><span className="w-7 h-7 bg-primary rounded flex items-center justify-center">{Icons.tooth}</span><span className="font-display text-sm font-bold">Dental<span className="text-primary">tery</span></span></div><nav className="flex-1 p-3 space-y-1">{NAV_ITEMS.map((item) => item.section === "pacientes" ? <Link href="/clinical-history-demo" key={item.section} className="flex items-center gap-3 px-3 py-3 text-sm font-display bg-primary-subtle text-primary rounded">{item.icon}{item.label}</Link> : <span key={item.section} className="flex items-center gap-3 px-3 py-3 text-sm text-muted">{item.icon}{item.label}</span>)}</nav><div className="p-4 border-t border-border"><p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-2">Prototipo clínico</p><p className="text-[11px] text-muted leading-relaxed">Datos ficticios.<br />Disponible en desarrollo.</p></div></aside>
    <div className="flex-1 flex flex-col min-w-0"><header className="h-14 border-b border-border bg-surface px-4 md:px-8 flex items-center justify-between shrink-0"><span className="font-display text-sm font-semibold">Pacientes <span className="text-muted font-normal mx-2">/</span> <span className="text-muted text-xs">{selectedPatientId ? "Detalle del paciente" : "Directorio"}</span></span><ThemeToggle variant="icon" /></header><main className="flex-1 overflow-y-auto">
      {selectedPatientId && <div className="px-4 md:px-8 pt-5 text-xs text-muted"><Link className="hover:text-primary" href="/clinical-history-demo" onClick={() => setSessionPatientId(undefined)}>← Volver a pacientes</Link></div>}
      {message && <p className="mx-8 my-3 text-xs text-primary" role="status">{message}</p>}
      {create ? <CreatePatient onBack={() => setCreate(false)} /> : selectedPatientId ? <PatientDetail key={selectedPatientId} patientId={selectedPatientId} initialTab="historial" onBack={() => { setSessionPatientId(undefined); router.push("/clinical-history-demo"); }} onNavigate={onNavigate} /> : <Patients onNavigate={onNavigate} />}
    </main></div>
  </div>;
}
