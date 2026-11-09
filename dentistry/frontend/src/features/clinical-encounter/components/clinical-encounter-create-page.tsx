"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Badge, Button, EmptyState, Icons, Select } from "@/shared/components/ui";
import { PatientContextBoundary } from "@/features/clinical-encounter/components/patient-context-boundary";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
import { ReadonlyField } from "@/features/clinical-encounter/components/clinical-encounter-readonly-field";
import { DateField } from "@/features/clinical-encounter/components/clinical-encounter-date-field";
import { TimeField } from "@/features/clinical-encounter/components/clinical-encounter-time-field";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import { TargetBadge } from "@/features/clinical-encounter/components/clinical-encounter-target-badge";
import { ToastStack } from "@/features/clinical-encounter/components/clinical-encounter-toast-stack";
import { ProcedureModal } from "@/features/clinical-encounter/components/modals/procedure-modal";
import { useCreateClinicalEncounter } from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import { useEncounterReferenceData } from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import { useToasts } from "@/features/clinical-encounter/hooks/use-toasts";
import { ClinicalEncounterPartialCreateError } from "@/features/clinical-encounter/services/clinical-encounter.service";
import type { ClinicalEncounterProcedureDraft } from "@/features/clinical-encounter/types/clinical-encounter";
import { nowDateValue, nowTimeValue } from "@/features/clinical-encounter/utils/dates";
import {
  appendProcedure,
  describeProcedure,
  emptyCreateForm,
  removeProcedureAt,
  suggestedTreatmentId,
  toCreateInput,
  type CreateEncounterFormValues,
} from "@/features/clinical-encounter/utils/encounter-create-form";

const CREATE_PERMISSION = "dentistry:encounters:create";

const clinicalTextFields: {
  key: "chiefComplaint" | "examinationSummary" | "diagnosisSummary" | "notes" | "patientInstructions" | "progressNotes";
  label: string;
  hint: string;
}[] = [
  {
    key: "chiefComplaint",
    label: "Motivo de consulta (opcional)",
    hint: "Motivo referido por el paciente.",
  },
  {
    key: "examinationSummary",
    label: "Exploración (opcional)",
    hint: "Hallazgos observados durante la atención.",
  },
  {
    key: "diagnosisSummary",
    label: "Diagnóstico (opcional)",
    hint: "Diagnóstico o impresión clínica.",
  },
  {
    key: "notes",
    label: "Notas (opcional)",
    hint: "Observaciones internas de la atención.",
  },
  {
    key: "patientInstructions",
    label: "Indicaciones al paciente (opcional)",
    hint: "Cuidados e indicaciones entregadas al paciente.",
  },
  {
    key: "progressNotes",
    label: "Notas de progreso (opcional)",
    hint: "Evolución o seguimiento posterior.",
  },
];

export function ClinicalEncounterCreatePage({ patientId }: { patientId: string }) {
  const session = useAuthenticatedSession();
  const canCreate = session.permissions.includes(CREATE_PERMISSION);

  if (!canCreate) {
    return (
      <PageContainer maxWidth="max-w-4xl">
        <PageHeader title="Nueva atención" breadcrumbs={[{ label: "Pacientes", href: "/patients" }]} />
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-foreground">No tienes permiso para crear atenciones clínicas.</p>
          <p className="mt-1 text-xs text-muted">
            Solicita el permiso <code>dentistry:encounters:create</code> a un administrador.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PatientContextBoundary patientId={patientId}>
      {(patient) => <ClinicalEncounterCreateForm patientId={patient.id} patientName={patient.fullName} />}
    </PatientContextBoundary>
  );
}

function ClinicalEncounterCreateForm({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const router = useRouter();
  const reference = useEncounterReferenceData(patientId);
  const create = useCreateClinicalEncounter();
  const { toasts, pushToast, dismissToast } = useToasts();

  const [values, setValues] = useState<CreateEncounterFormValues>(() => ({
    ...emptyCreateForm(),
    startDate: nowDateValue(),
    startTime: nowTimeValue(),
  }));
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [partialEncounterId, setPartialEncounterId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    branchId?: string;
    startedAt?: string;
  }>({});

  const listHref = `/patients/${patientId}/clinical-encounters`;
  const breadcrumbs = [
    { label: "Pacientes", href: "/patients" },
    { label: patientName, href: `/patients/${patientId}` },
    { label: "Atenciones clínicas", href: listHref },
    { label: "Nueva atención" },
  ];

  if (reference.isPending) {
    return (
      <PageContainer maxWidth="max-w-4xl">
        <PageHeader title="Nueva atención" breadcrumbs={breadcrumbs} />
        <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Cargando datos de referencia…
        </p>
      </PageContainer>
    );
  }

  if (reference.isError || !reference.data) {
    return (
      <PageContainer maxWidth="max-w-4xl">
        <PageHeader title="Nueva atención" breadcrumbs={breadcrumbs} />
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">
            No se pudieron cargar las sucursales, citas y tratamientos. Inténtalo nuevamente.
          </p>
          <Button variant="outline" onClick={() => { void reference.refetch(); }}>
            Reintentar
          </Button>
          <p className="mt-4 text-sm">
            <Link href={listHref} className="text-primary hover:underline">
              Volver al listado
            </Link>
          </p>
        </div>
      </PageContainer>
    );
  }

  const data = reference.data;

  function updateField<K extends keyof CreateEncounterFormValues>(
    key: K,
    value: CreateEncounterFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));

    if (key === "branchId") {
      setValidationErrors((current) => ({ ...current, branchId: undefined }));
    }
    if (key === "startDate" || key === "startTime") {
      setValidationErrors((current) => ({ ...current, startedAt: undefined }));
    }
  }

  function handleAppointmentChange(appointmentId: string) {
    setValues((current) => {
      const suggested = suggestedTreatmentId(appointmentId, data.appointments);
      // Sin sugerencia se conserva el tratamiento actual: puede ser una
      // selección manual. Solo se sugiere, nunca se borra lo elegido.
      return {
        ...current,
        appointmentId,
        treatmentId: suggested ?? current.treatmentId,
      };
    });
  }

  function handleProceduresAdded(procedures: ClinicalEncounterProcedureDraft[]) {
    setValues((current) => ({
      ...current,
      procedures: appendProcedure(current.procedures, procedures),
    }));
    setProcedureModalOpen(false);
  }

  function planLabel(procedure: ClinicalEncounterProcedureDraft): string {
    const id = procedure.treatmentProcedureId;
    if (!id) return "Sin vínculo a plan";
    const match = data.treatmentProcedures.find((item) => item.id === id);
    return match ? `Plan: ${match.label}` : "Sin vínculo a plan";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = toCreateInput(values, patientId);
    if ("error" in result) {
      setFormError(result.error);
      setPartialEncounterId(null);
      setValidationErrors(
        result.field === "branchId"
          ? { branchId: result.error }
          : { startedAt: result.error },
      );
      return;
    }

    setFormError(null);
    setPartialEncounterId(null);
    setValidationErrors({});
    create.mutate(
      { encounter: result.input, procedures: values.procedures },
      {
        onSuccess: (created) => {
          pushToast("Atención clínica creada.");
          router.push(`/patients/${patientId}/clinical-encounters/${created.id}`);
        },
        onError: (error) => {
          const message =
            error instanceof Error ? error.message : "No se pudo crear la atención clínica.";
          setFormError(message);
          setPartialEncounterId(
            error instanceof ClinicalEncounterPartialCreateError ? error.encounterId : null,
          );
          pushToast(message, "danger");
        },
      },
    );
  }

  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeader
        title="Nueva atención"
        description="Registra el inicio de la atención. Solo la sucursal, la fecha y la hora son obligatorias."
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="outline" onClick={() => router.push(listHref)} disabled={create.isPending}>
            Cancelar
          </Button>
        }
      />

      {formError && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-danger/30 bg-danger-subtle px-4 py-3 text-sm text-danger"
        >
          <p>{formError}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
            {partialEncounterId ? (
              <>
                <Link
                  href={`/patients/${patientId}/clinical-encounters/${partialEncounterId}`}
                  className="text-primary hover:underline"
                >
                  Ver la atención creada
                </Link>
                <span>No reintentes: la atención ya fue creada.</span>
              </>
            ) : (
              <Link href={listHref} className="text-primary hover:underline">
                Ver atenciones clínicas
              </Link>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Panel
          id="ce-create-context"
          title="Contexto de la atención"
          description="Paciente, sucursal y referencias opcionales."
          icon={Icons.branch}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField label="Paciente" value={patientName} badge="Paciente" />
            <Select
              id="ce-create-branch"
              label="Sucursal *"
              value={values.branchId}
              onChange={(event) => updateField("branchId", event.target.value)}
              error={validationErrors.branchId}
              options={[
                { value: "", label: "Selecciona una sucursal" },
                ...data.branches.map((branch) => ({ value: branch.id, label: branch.label })),
              ]}
            />
            <Select
              id="ce-create-appointment"
              label="Cita (opcional)"
              value={values.appointmentId}
              onChange={(event) => handleAppointmentChange(event.target.value)}
              options={[
                { value: "", label: "Sin cita vinculada" },
                ...data.appointments.map((appointment) => ({
                  value: appointment.id,
                  label: appointment.label,
                })),
              ]}
            />
            <Select
              id="ce-create-treatment"
              label="Tratamiento (opcional)"
              value={values.treatmentId}
              onChange={(event) => updateField("treatmentId", event.target.value)}
              options={[
                { value: "", label: "Sin tratamiento vinculado" },
                ...data.treatments.map((treatment) => ({
                  value: treatment.id,
                  label: treatment.label,
                })),
              ]}
            />
          </div>
          <p className="mt-3 text-[11px] text-muted">
            La cita y el tratamiento son opcionales. Si la cita trae un tratamiento asociado en los
            datos de referencia, se sugiere automáticamente.
          </p>
        </Panel>

        <Panel
          id="ce-create-attention"
          title="Atención"
          description="Inicio y registro clínico. Los campos de texto son opcionales."
          icon={Icons.clock}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField
              id="ce-create-date"
              label="Fecha de inicio *"
              value={values.startDate}
              onChange={(value) => updateField("startDate", value)}
              error={validationErrors.startedAt}
              disabled={create.isPending}
            />
            <TimeField
              id="ce-create-time"
              label="Hora de inicio *"
              value={values.startTime}
              onChange={(value) => updateField("startTime", value)}
              error={validationErrors.startedAt}
              disabled={create.isPending}
            />
          </div>
          <div className="mt-4 space-y-4">
            {clinicalTextFields.map((field) => (
              <TextAreaField
                key={field.key}
                id={`ce-create-${field.key}`}
                label={field.label}
                hint={field.hint}
                value={values[field.key]}
                onChange={(value) => updateField(field.key, value)}
                rows={3}
              />
            ))}
          </div>
        </Panel>

        <Panel
          id="ce-create-procedures"
          title="Procedimientos realizados"
          description="Opcional. Puedes crear la atención sin registrar procedimientos."
          icon={Icons.tooth}
          action={
            <Button
              size="sm"
              variant="outline"
              leftIcon={Icons.plus}
              onClick={() => setProcedureModalOpen(true)}
              disabled={create.isPending}
            >
              Añadir procedimiento
            </Button>
          }
        >
          {values.procedures.length === 0 ? (
            <EmptyState
              className="py-6"
              message="Aún no hay procedimientos"
              description="Registra acciones realizadas sobre piezas, regiones o boca completa."
              icon={Icons.tooth}
              action={
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={Icons.plus}
                  onClick={() => setProcedureModalOpen(true)}
                  disabled={create.isPending}
                >
                  Registrar procedimiento
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {values.procedures.map((procedure, index) => (
                <li
                  key={`${procedure.targetType}-${procedure.toothNumber ?? procedure.targetDescription ?? "target"}-${index}`}
                  className="flex flex-wrap items-center gap-3 py-3"
                >
                  <TargetBadge targetType={procedure.targetType} toothNumber={procedure.toothNumber} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{procedure.description}</p>
                    {procedure.targetDescription && (
                      <p className="text-xs text-muted">Objetivo: {procedure.targetDescription}</p>
                    )}
                    <p className="text-xs text-muted">{planLabel(procedure)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Quitar ${describeProcedure(procedure)}`}
                    onClick={() =>
                      updateField("procedures", removeProcedureAt(values.procedures, index))
                    }
                    disabled={create.isPending}
                  >
                    Quitar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="sticky bottom-3 z-20">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="neutral" size="sm">
                Procedimientos: {values.procedures.length}
              </Badge>
              <Badge variant="neutral" size="sm">
                Campos clínicos opcionales
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => router.push(listHref)}
                disabled={create.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1 sm:flex-none"
                leftIcon={Icons.check}
                loading={create.isPending}
                disabled={create.isPending || Boolean(partialEncounterId)}
              >
                Crear atención
              </Button>
            </div>
          </div>
        </div>
      </form>

      <ProcedureModal
        open={procedureModalOpen}
        onClose={() => setProcedureModalOpen(false)}
        onConfirm={handleProceduresAdded}
        treatmentProcedures={data.treatmentProcedures}
        defaultTreatmentId={values.treatmentId || undefined}
        submitting={create.isPending}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PageContainer>
  );
}
