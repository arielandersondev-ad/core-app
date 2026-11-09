"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { patientDetailOptions } from "@/features/patient/api/query-options";
import { ApiError } from "@/infrastructure/http/api-error";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Button, Icons } from "@/shared/components/ui";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { UpdatePatientDialog } from "@/features/patient/components/update-patient-dialog";
import { DeletePatientConfirmation } from "@/features/patient/components/delete-patient-confirmation";

function PatientField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1 border-b border-border py-4 last:border-b-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="text-sm text-foreground">{value || "No registrado"}</dd>
    </div>
  );
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es", { dateStyle: "long" }).format(date);
}

export function PatientDetailPage({ patientId }: { patientId: string }) {
  const query = useQuery(patientDetailOptions(patientId));
  const router = useRouter();
  const session = useAuthenticatedSession();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updatedMessage, setUpdatedMessage] = useState("");

  if (query.isPending) {
    return <PageContainer><p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">Cargando paciente…</p></PageContainer>;
  }

  if (query.isError) {
    const isMissing = query.error instanceof ApiError && query.error.status === 404;
    const message = isMissing
      ? "No se encontró este paciente en tu organización."
      : query.error instanceof ApiError && query.error.status === 403
        ? "No tienes permiso para consultar este paciente."
        : "No se pudo cargar el paciente. Inténtalo nuevamente.";

    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">{message}</p>
          {!isMissing && <Button variant="outline" onClick={() => { void query.refetch(); }}>Reintentar</Button>}
          <div className="mt-4"><Link href="/patients" className="text-sm text-primary hover:underline">Volver a pacientes</Link></div>
        </div>
      </PageContainer>
    );
  }

  const patient = query.data;
  return (
    <PageContainer>
      <div className="mb-4 text-sm"><Link href="/patients" className="text-primary hover:underline">← Volver a pacientes</Link></div>
      <PageHeader
        title={patient.fullName}
        description={`Paciente ${patient.status === "ACTIVE" ? "activo" : "inactivo"}`}
        breadcrumbs={[{ label: "Pacientes", href: "/patients" }, { label: patient.fullName }]}
        action={<div className="flex flex-wrap gap-2">
          {session.permissions.includes("dentistry:encounters:create") && (
            <Link href={`/patients/${encodeURIComponent(patient.id)}/clinical-encounters/new`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] px-4 font-display text-sm font-semibold text-[var(--primary-foreground)] shadow-2xs transition-all hover:bg-[var(--primary-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40">
              <span className="flex shrink-0 items-center" aria-hidden="true">
                {Icons.plus}
              </span>
              Nueva atención
            </Link>
          )}
          {session.permissions.includes("dentistry:encounters:read") && (
            <>
              <Link href={`/patients/${encodeURIComponent(patient.id)}/clinical-encounters`} className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] px-4 font-display text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--neutral-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40">Atenciones clínicas</Link>
              <Link href={`/patients/${encodeURIComponent(patient.id)}/health-profile`} className="inline-flex h-10 items-center justify-center rounded-[var(--radius)] border border-[var(--border)] px-4 font-display text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--neutral-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40">Perfil de salud</Link>
            </>
          )}
          {session.permissions.includes("dentistry:patients:update") && <Button variant="outline" onClick={() => setEditing(true)}>Editar paciente</Button>}
          {session.permissions.includes("dentistry:patients:delete") && <Button variant="danger" onClick={() => setConfirmingDelete(true)}>Eliminar paciente</Button>}
        </div>}
      />
      {updatedMessage && <p role="status" className="my-4 rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">{updatedMessage}</p>}
      {confirmingDelete && <DeletePatientConfirmation patientId={patient.id} patientName={patient.fullName} onCancel={() => setConfirmingDelete(false)} onDeleted={() => router.replace("/patients")} />}
      <section aria-labelledby="patient-contact-heading" className="rounded-xl border border-border bg-surface px-5">
        <h2 id="patient-contact-heading" className="border-b border-border py-4 font-display text-base font-semibold text-foreground">Datos personales y de contacto</h2>
        <dl className="grid gap-x-8 sm:grid-cols-2">
          <PatientField label="Nombres" value={patient.firstName} />
          <PatientField label="Apellidos" value={patient.lastName} />
          <PatientField label="Documento" value={patient.documentNumber ? `${patient.documentType ?? "Documento"} ${patient.documentNumber}` : null} />
          <PatientField label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
          <PatientField label="Sexo" value={patient.sex} />
          <PatientField label="Teléfono" value={patient.phone} />
          <PatientField label="Correo electrónico" value={patient.email} />
          <PatientField label="Dirección" value={patient.address} />
          <PatientField label="Notas" value={patient.notes} />
        </dl>
      </section>
      <p className="mt-4 text-xs text-muted">Registrado: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(patient.createdAt))} · Actualizado: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(patient.updatedAt))}</p>
      {editing && <UpdatePatientDialog patient={patient} onClose={() => setEditing(false)} onUpdated={(updated) => { setUpdatedMessage(`${updated.fullName} se actualizó correctamente.`); }} />}
    </PageContainer>
  );
}
