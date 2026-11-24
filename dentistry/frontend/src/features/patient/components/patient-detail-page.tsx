"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { patientDetailOptions } from "@/features/patient/api/query-options";
import { ApiError } from "@/infrastructure/http/api-error";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Badge, Button, buttonClassName, Icons, StatusMessage } from "@/shared/components/ui";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { UpdatePatientDialog } from "@/features/patient/components/update-patient-dialog";
import { DeletePatientConfirmation } from "@/features/patient/components/delete-patient-confirmation";
import { ActionsMenu, MenuItem, MenuSeparator } from "@/features/patient/components/actions-menu";
import { PatientTabs } from "@/features/patient/components/patient-tabs";
import { QuickProcedureModal } from "@/features/clinical-encounter/components/modals/quick-procedure-modal";
import { ClinicalFilesPanel } from "@/features/clinical-encounter/components/clinical-files-panel";
import { PatientWalletCard } from "@/features/billing/components/patient-wallet-card";
import { TreatmentPaymentDialog } from "@/features/billing/components/treatment-payment-dialog";
import { useTreatments } from "@/features/billing/hooks/use-billing";
import type { Treatment } from "@/features/billing/types/billing";
import { collectableTreatments } from "@/features/billing/utils/wallet";
import { isModuleEnabled } from "@/shared/plan/plan-access";
import { formatMinorCurrency } from "@/shared/utils/formatters";

function PatientField({ label, value, wide = false }: { label: string; value: string | null; wide?: boolean }) {
  return (
    <div className={`space-y-1 border-b border-border py-3 ${wide ? "col-span-full" : ""}`}>
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

export function PatientDetailPage({ patientId, tab = "summary" }: { patientId: string; tab?: "summary" | "files" }) {
  const query = useQuery(patientDetailOptions(patientId));
  const router = useRouter();
  const session = useAuthenticatedSession();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [updatedMessage, setUpdatedMessage] = useState("");
  const [registeringProcedure, setRegisteringProcedure] = useState(false);
  const [quickEncounterId, setQuickEncounterId] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<Treatment | null>(null);
  const canRegisterProcedure =
    session.permissions.includes("dentistry:encounters:create") &&
    isModuleEnabled(session.plan, "procedures");
  const canCollect =
    session.permissions.includes("dentistry:payments:create") &&
    session.permissions.includes("dentistry:treatments:read") &&
    isModuleEnabled(session.plan, "payments") &&
    isModuleEnabled(session.plan, "treatments");
  // Misma consulta que la cartera: React Query la comparte, no se pide dos veces.
  const treatments = useTreatments(patientId, canCollect);
  const collectable = collectableTreatments(treatments.data?.items ?? []);

  if (query.isPending) {
    return <PageContainer><StatusMessage variant="loading" message="Cargando paciente…" /></PageContainer>;
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
        <StatusMessage
          variant="error"
          message={message}
          action={<>
            {!isMissing && <Button variant="outline" onClick={() => { void query.refetch(); }}>Reintentar</Button>}
            <Link href="/patients" className="text-sm text-primary hover:underline">Volver a pacientes</Link>
          </>}
        />
      </PageContainer>
    );
  }

  const patient = query.data;
  const accountHref = `/patients/${encodeURIComponent(patient.id)}/account`;
  const canUpdate = session.permissions.includes("dentistry:patients:update");
  const canDelete = session.permissions.includes("dentistry:patients:delete");

  // Con un solo tratamiento con saldo se abona aquí; con varios se elige en la cuenta.
  const startPayment = () => {
    if (collectable.length === 1) setCollecting(collectable[0]);
    else router.push(accountHref);
  };

  return (
    <PageContainer>
      <div className="mb-4 text-sm"><Link href="/patients" className="text-primary hover:underline">← Volver a pacientes</Link></div>
      <PageHeader
        title={patient.fullName}
        description={patient.phone ?? undefined}
        badge={<Badge variant={patient.status === "ACTIVE" ? "success" : "neutral"} size="sm">{patient.status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>}
        breadcrumbs={[{ label: "Pacientes", href: "/patients" }, { label: patient.fullName }]}
        action={<>
          {session.permissions.includes("dentistry:encounters:create") && (
            <Link href={`/patients/${encodeURIComponent(patient.id)}/clinical-encounters/new`} className={buttonClassName()}>
              <span className="flex shrink-0 items-center" aria-hidden="true">
                {Icons.plus}
              </span>
              Nueva atención
            </Link>
          )}
          {canCollect && collectable.length > 0 && (
            <Button variant="outline" leftIcon={Icons.payments} onClick={startPayment}>
              Registrar abono
            </Button>
          )}
          {(canRegisterProcedure || canUpdate || canDelete) && (
            <ActionsMenu label="Más acciones del paciente">
              {canRegisterProcedure && (
                <MenuItem onSelect={() => setRegisteringProcedure(true)}>Registrar procedimiento</MenuItem>
              )}
              {canUpdate && <MenuItem onSelect={() => setEditing(true)}>Editar paciente</MenuItem>}
              {canDelete && (
                <>
                  <MenuSeparator />
                  <MenuItem danger onSelect={() => setConfirmingDelete(true)}>Eliminar paciente</MenuItem>
                </>
              )}
            </ActionsMenu>
          )}
        </>}
      />
      <PatientTabs patientId={patient.id} active={tab} />
      {updatedMessage && <p role="status" className="mb-4 rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">{updatedMessage}</p>}
      {quickEncounterId && (
        <p role="status" className="mb-4 rounded-lg bg-success-subtle px-4 py-3 text-sm text-success">
          Procedimiento registrado.{" "}
          {session.permissions.includes("dentistry:encounters:read") && (
            <Link href={`/patients/${encodeURIComponent(patient.id)}/clinical-encounters/${encodeURIComponent(quickEncounterId)}`} className="font-medium underline">
              Ver atención
            </Link>
          )}
        </p>
      )}
      {registeringProcedure && (
        <QuickProcedureModal
          patientId={patient.id}
          onClose={() => setRegisteringProcedure(false)}
          onRegistered={(encounter) => {
            setQuickEncounterId(encounter.id);
            setRegisteringProcedure(false);
          }}
        />
      )}
      {collecting && (
        <TreatmentPaymentDialog
          patientId={patient.id}
          treatment={collecting}
          onClose={() => setCollecting(null)}
          onRegistered={(payment) => {
            setCollecting(null);
            setUpdatedMessage(`Abono de ${formatMinorCurrency(payment.amountMinor, payment.currency)} registrado.`);
          }}
        />
      )}
      {confirmingDelete && <DeletePatientConfirmation patientId={patient.id} patientName={patient.fullName} onCancel={() => setConfirmingDelete(false)} onDeleted={() => router.replace("/patients")} />}

      {tab === "files" ? (
        <ClinicalFilesPanel patientId={patient.id} />
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="patient-contact-heading" className="rounded-xl border border-border bg-surface px-5">
            <h2 id="patient-contact-heading" className="border-b border-border py-4 font-display text-base font-semibold text-foreground">Datos personales y de contacto</h2>
            <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              <PatientField label="Nombres" value={patient.firstName} />
              <PatientField label="Apellidos" value={patient.lastName} />
              <PatientField label="Documento" value={patient.documentNumber ? `${patient.documentType ?? "Documento"} ${patient.documentNumber}` : null} />
              <PatientField label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
              <PatientField label="Sexo" value={patient.sex} />
              <PatientField label="Teléfono" value={patient.phone} />
              <PatientField label="Correo electrónico" value={patient.email} />
              <PatientField label="Dirección" value={patient.address} />
              <PatientField label="Notas" value={patient.notes} wide />
            </dl>
          </section>
          <PatientWalletCard patientId={patient.id} onRegisterPayment={startPayment} />
          <p className="text-xs text-muted">Registrado: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(patient.createdAt))} · Actualizado: {new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(new Date(patient.updatedAt))}</p>
        </div>
      )}
      {editing && <UpdatePatientDialog patient={patient} onClose={() => setEditing(false)} onUpdated={(updated) => { setUpdatedMessage(`${updated.fullName} se actualizó correctamente.`); }} />}
    </PageContainer>
  );
}
