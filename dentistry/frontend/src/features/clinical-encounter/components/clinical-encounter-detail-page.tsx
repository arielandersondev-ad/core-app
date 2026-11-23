"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PatientDto } from "@/features/patient/types/patient";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { ApiError } from "@/infrastructure/http/api-error";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Badge, Button, EmptyState, Icons } from "@/shared/components/ui";
import { InfoRow } from "@/features/clinical-encounter/components/clinical-encounter-info-row";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
import { ClinicalFilesPanel } from "@/features/clinical-encounter/components/clinical-files-panel";
import { PatientContextBoundary } from "@/features/clinical-encounter/components/patient-context-boundary";
import { StatusBadge } from "@/features/clinical-encounter/components/clinical-encounter-status-badge";
import { TargetBadge } from "@/features/clinical-encounter/components/clinical-encounter-target-badge";
import { TextBlock } from "@/features/clinical-encounter/components/clinical-encounter-text-block";
import { ToastStack } from "@/features/clinical-encounter/components/clinical-encounter-toast-stack";
import { CompleteEncounterModal } from "@/features/clinical-encounter/components/modals/complete-encounter-modal";
import { ProcedureModal } from "@/features/clinical-encounter/components/modals/procedure-modal";
import { VoidEncounterModal } from "@/features/clinical-encounter/components/modals/void-encounter-modal";
import {
  useClinicalEncounter,
  useEncounterReferenceData,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import {
  useAddClinicalEncounterProcedures,
  useCompleteClinicalEncounter,
  useVoidClinicalEncounter,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import { useToasts } from "@/features/clinical-encounter/hooks/use-toasts";
import type {
  ClinicalEncounterProcedureDraft,
  CompleteClinicalEncounterInput,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { durationLabel, formatDateOnly, formatDateTimeShort } from "@/features/clinical-encounter/utils/dates";
import { useTimeZoneResolver } from "@/shared/time/use-time-zone";
import {
  canAddProcedures,
  canComplete,
  canVoid,
  summarizeProcedures,
} from "@/features/clinical-encounter/utils/encounter-detail";
import { ProcedureValidationError } from "@/features/clinical-encounter/utils/procedures";

const READ_PERMISSION = "dentistry:encounters:read";
const UPDATE_PERMISSION = "dentistry:encounters:update";
const VOID_PERMISSION = "dentistry:encounters:void";

function encountersListHref(patientId: string): string {
  return `/patients/${encodeURIComponent(patientId)}/clinical-encounters`;
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ProcedureValidationError) return error.message;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return "No se pudo completar la acción.";
}

export interface ClinicalEncounterDetailPageProps {
  patientId: string;
  encounterId: string;
}

export function ClinicalEncounterDetailPage({
  patientId,
  encounterId,
}: ClinicalEncounterDetailPageProps) {
  return (
    <PatientContextBoundary patientId={patientId}>
      {(patient) => <EncounterDetailGate patient={patient} encounterId={encounterId} />}
    </PatientContextBoundary>
  );
}

function EncounterDetailGate({
  patient,
  encounterId,
}: {
  patient: PatientDto;
  encounterId: string;
}) {
  const session = useAuthenticatedSession();

  if (!session.permissions.includes(READ_PERMISSION)) {
    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">
            No tienes permiso para consultar las atenciones clínicas de este paciente.
          </p>
          <Link href={`/patients/${encodeURIComponent(patient.id)}`} className="text-sm text-primary hover:underline">
            Volver al paciente
          </Link>
        </div>
      </PageContainer>
    );
  }

  return <EncounterDetailContent patient={patient} encounterId={encounterId} />;
}

function EncounterDetailContent({
  patient,
  encounterId,
}: {
  patient: PatientDto;
  encounterId: string;
}) {
  const patientId = patient.id;
  const router = useRouter();
  const session = useAuthenticatedSession();
  const timeZoneOf = useTimeZoneResolver();
  const { toasts, pushToast, dismissToast } = useToasts();

  const encounterQuery = useClinicalEncounter(patientId, encounterId);
  const referenceQuery = useEncounterReferenceData(patientId);

  const completeMutation = useCompleteClinicalEncounter(patientId);
  const voidMutation = useVoidClinicalEncounter(patientId);
  const addProceduresMutation = useAddClinicalEncounterProcedures(patientId);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [procedureOpen, setProcedureOpen] = useState(false);

  const listHref = encountersListHref(patientId);

  if (encounterQuery.isPending) {
    return (
      <PageContainer>
        <p role="status" className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Cargando atención clínica…
        </p>
      </PageContainer>
    );
  }

  if (encounterQuery.isError) {
    const notFound = isNotFoundError(encounterQuery.error);

    return (
      <PageContainer>
        <div role="alert" className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="mb-4 text-sm text-foreground">
            {notFound
              ? "No se encontró esta atención clínica en tu organización."
              : "No se pudo cargar la atención clínica. Inténtalo nuevamente."}
          </p>
          {!notFound && (
            <Button variant="outline" onClick={() => { void encounterQuery.refetch(); }}>
              Reintentar
            </Button>
          )}
          <div className="mt-4">
            <Link href={listHref} className="text-sm text-primary hover:underline">
              Volver al listado
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const encounter = encounterQuery.data;
  // Fechas en la zona de la sucursal donde se atendió.
  const timeZone = timeZoneOf(encounter.branchId);
  const canUpdate = session.permissions.includes(UPDATE_PERMISSION);
  const canVoidEncounter = session.permissions.includes(VOID_PERMISSION);
  const canAddProcedureNow = canAddProcedures(encounter.status) && canUpdate;
  const canCompleteNow = canComplete(encounter.status) && canUpdate;
  const canVoidNow = canVoid(encounter.status) && canVoidEncounter;

  const referenceData = referenceQuery.data;
  const referencePending = referenceQuery.isPending;
  const referenceFailed = referenceQuery.isError;
  const appointmentLabel = encounter.appointmentId
    ? referenceData?.appointments.find((item) => item.id === encounter.appointmentId)?.label
    : undefined;
  const treatmentLabel = encounter.treatmentId
    ? referenceData?.treatments.find((item) => item.id === encounter.treatmentId)?.label
    : undefined;
  const appointmentValue = encounter.appointmentId
    ? referencePending
      ? "Cargando…"
      : referenceFailed
        ? "No disponible"
        : (appointmentLabel ?? "Cita vinculada")
    : "Sin cita";
  const treatmentValue = encounter.treatmentId
    ? referencePending
      ? "Cargando…"
      : referenceFailed
        ? "No disponible"
        : (treatmentLabel ?? "No disponible")
    : "Sin tratamiento";
  const treatmentProcedures = referenceData?.treatmentProcedures ?? [];
  const procedureTally = summarizeProcedures(encounter.procedures);

  const clinicalBlocks = [
    { label: "Motivo de consulta", value: encounter.chiefComplaint },
    { label: "Exploración", value: encounter.examinationSummary },
    { label: "Diagnóstico", value: encounter.diagnosisSummary },
    { label: "Resumen de procedimientos", value: encounter.procedureSummary },
    { label: "Notas de evolución", value: encounter.progressNotes },
    { label: "Instrucciones al paciente", value: encounter.patientInstructions },
    { label: "Notas", value: encounter.notes },
  ];

  const handleComplete = async (input: CompleteClinicalEncounterInput) => {
    setCompleteError(null);
    try {
      await completeMutation.mutateAsync({ encounterId: encounter.id, input });
      setCompleteOpen(false);
      pushToast("Atención completada.", "success");
    } catch (error) {
      setCompleteError(mutationErrorMessage(error));
    }
  };

  const handleVoid = async (reason: string) => {
    setVoidError(null);
    try {
      await voidMutation.mutateAsync({ encounterId: encounter.id, input: { reason } });
      setVoidOpen(false);
      pushToast("Atención anulada.", "success");
    } catch (error) {
      setVoidError(mutationErrorMessage(error));
    }
  };

  const handleAddProcedures = async (procedures: ClinicalEncounterProcedureDraft[]) => {
    try {
      await addProceduresMutation.mutateAsync({ encounterId: encounter.id, procedures });
      setProcedureOpen(false);
      pushToast(
        `${procedures.length} procedimiento(s) registrado(s).`,
        "success",
      );
    } catch (error) {
      pushToast(mutationErrorMessage(error), "danger");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Atención del ${formatDateOnly(encounter.startedAt, timeZone)}`}
        description={`${encounter.practitionerName ?? "Profesional sin asignar"} · ${encounter.branchName ?? "Sucursal sin asignar"}`}
        badge={<StatusBadge status={encounter.status} />}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patient.fullName, href: `/patients/${encodeURIComponent(patient.id)}` },
          { label: "Atenciones clínicas", href: listHref },
          { label: `Atención ${formatDateOnly(encounter.startedAt, timeZone)}` },
        ]}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.push(listHref)}>
              Volver al listado
            </Button>
            {canCompleteNow && (
              <Button
                variant="primary"
                leftIcon={Icons.check}
                onClick={() => {
                  setCompleteError(null);
                  setCompleteOpen(true);
                }}
              >
                Completar
              </Button>
            )}
            {canVoidNow && (
              <Button
                variant="danger"
                leftIcon={Icons.alertTriangle}
                onClick={() => {
                  setVoidError(null);
                  setVoidOpen(true);
                }}
              >
                Anular
              </Button>
            )}
            {canAddProcedureNow && (
              <Button
                variant="outline"
                leftIcon={Icons.plus}
                onClick={() => setProcedureOpen(true)}
              >
                Añadir procedimiento
              </Button>
            )}
          </div>
        }
      />

      {encounter.status === "COMPLETED" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-success/30 bg-success-subtle px-4 py-3 text-success">
          <span className="mt-0.5 shrink-0">{Icons.check}</span>
          <p className="text-sm">
            Completada el {formatDateTimeShort(encounter.completedAt, timeZone)} por{" "}
            {encounter.completedByName ?? "—"}. El registro clínico está cerrado; los metadatos de
            archivos siguen siendo gestionables.
          </p>
        </div>
      )}
      {encounter.status === "VOIDED" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-warning">
          <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
          <p className="text-sm">
            Anulada el {formatDateTimeShort(encounter.voidedAt, timeZone)} ·{" "}
            {encounter.voidReason ?? "Sin motivo registrado"}. La evidencia permanece en el historial.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <Panel id="ce-detail-summary" title="Resumen" icon={Icons.clock}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Estado" value={<StatusBadge status={encounter.status} />} />
            <InfoRow label="Inicio" value={formatDateTimeShort(encounter.startedAt, timeZone)} />
            <InfoRow
              label="Fin"
              value={encounter.endedAt ? formatDateTimeShort(encounter.endedAt, timeZone) : "—"}
            />
            <InfoRow
              label="Duración"
              value={durationLabel(encounter.startedAt, encounter.endedAt)}
            />
            <InfoRow label="Profesional" value={encounter.practitionerName ?? "—"} />
            <InfoRow label="Sucursal" value={encounter.branchName ?? "—"} />
            <InfoRow label="Cita" value={appointmentValue} />
            <InfoRow label="Tratamiento" value={treatmentValue} />
          </div>

          {encounter.status === "COMPLETED" && (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
              <InfoRow
                label="Completada el"
                value={encounter.completedAt ? formatDateTimeShort(encounter.completedAt, timeZone) : "—"}
              />
              <InfoRow label="Completada por" value={encounter.completedByName ?? "—"} />
            </div>
          )}

          {encounter.status === "VOIDED" && (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
              <InfoRow
                label="Anulada el"
                value={encounter.voidedAt ? formatDateTimeShort(encounter.voidedAt, timeZone) : "—"}
              />
              <InfoRow label="Motivo de anulación" value={encounter.voidReason ?? "—"} />
            </div>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4">
            <Panel id="ce-detail-clinical" title="Contenido clínico" icon={Icons.search}>
              <div className="grid gap-4 sm:grid-cols-2">
                {clinicalBlocks.map((block) => (
                  <TextBlock key={block.label} label={block.label} value={block.value} />
                ))}
              </div>
            </Panel>

            <Panel
              id="ce-detail-procedures"
              title="Procedimientos"
              description={`${procedureTally.recorded} registrado(s)${
                procedureTally.voided ? ` · ${procedureTally.voided} anulado(s)` : ""
              }`}
              icon={Icons.tooth}
              action={
                canAddProcedureNow ? (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Icons.plus}
                    onClick={() => setProcedureOpen(true)}
                  >
                    Agregar
                  </Button>
                ) : undefined
              }
            >
              {encounter.procedures.length === 0 ? (
                <EmptyState
                  className="py-6"
                  message="Sin procedimientos registrados"
                  description="Una atención puede completarse con cero procedimientos."
                  icon={Icons.tooth}
                  action={
                    canAddProcedureNow ? (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={Icons.plus}
                        onClick={() => setProcedureOpen(true)}
                      >
                        Registrar procedimiento
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-border">
                  {encounter.procedures.map((procedure) => {
                    const linked = treatmentProcedures.find(
                      (item) => item.id === procedure.treatmentProcedureId,
                    );
                    const isVoided = procedure.status === "VOIDED";
                    const planLabel = procedure.treatmentProcedureId
                      ? referencePending
                        ? "Plan: Cargando…"
                        : referenceFailed
                          ? "Plan: No disponible"
                          : `Plan: ${linked?.label ?? "No disponible"}`
                      : "Sin vínculo a plan";

                    return (
                      <li
                        key={procedure.id}
                        className={`flex flex-wrap items-start gap-3 py-3 ${isVoided ? "opacity-70" : ""}`}
                      >
                        <span className="mt-0.5 shrink-0">
                          <TargetBadge
                            targetType={procedure.targetType}
                            toothNumber={procedure.toothNumber}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">{procedure.description}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {procedure.targetDescription ? `${procedure.targetDescription} · ` : ""}
                            {planLabel}
                          </p>
                          {isVoided && procedure.voidReason && (
                            <p className="mt-1 text-xs text-warning">
                              Motivo de anulación: {procedure.voidReason}
                            </p>
                          )}
                        </div>
                        <Badge variant={isVoided ? "warning" : "success"}>
                          {isVoided ? "Anulado" : "Registrado"}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>

          <ClinicalFilesPanel
            patientId={patientId}
            encounterId={encounter.id}
            uploadLockedReason={
              encounter.status === "VOIDED" ? "La atención está anulada: no se pueden adjuntar archivos." : undefined
            }
            timeZone={timeZone}
            onNotify={pushToast}
          />
        </div>
      </div>

      {completeOpen && (
        <CompleteEncounterModal
          open
          encounter={encounter}
          onClose={() => {
            if (completeMutation.isPending) return;
            setCompleteOpen(false);
            setCompleteError(null);
          }}
          onConfirm={(input) => { void handleComplete(input); }}
          submitting={completeMutation.isPending}
          error={completeError}
        />
      )}

      {voidOpen && (
        <VoidEncounterModal
          open
          onClose={() => {
            if (voidMutation.isPending) return;
            setVoidOpen(false);
            setVoidError(null);
          }}
          onConfirm={(reason) => { void handleVoid(reason); }}
          submitting={voidMutation.isPending}
          error={voidError}
        />
      )}

      {procedureOpen && (
        <ProcedureModal
          open
          onClose={() => setProcedureOpen(false)}
          onConfirm={(procedures) => { void handleAddProcedures(procedures); }}
          treatmentProcedures={treatmentProcedures}
          defaultTreatmentId={encounter.treatmentId}
          submitting={addProceduresMutation.isPending}
        />
      )}

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </PageContainer>
  );
}
