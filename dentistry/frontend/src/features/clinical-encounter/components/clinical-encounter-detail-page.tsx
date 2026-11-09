"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type ChangeEvent } from "react";
import type { PatientDto } from "@/features/patient/types/patient";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { ApiError } from "@/infrastructure/http/api-error";
import { PageContainer, PageHeader } from "@/shared/components/layout";
import { Badge, Button, EmptyState, Icons } from "@/shared/components/ui";
import { InfoRow } from "@/features/clinical-encounter/components/clinical-encounter-info-row";
import { Panel } from "@/features/clinical-encounter/components/clinical-encounter-panel";
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
  useClinicalFiles,
  useEncounterReferenceData,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-data";
import {
  useAddClinicalEncounterProcedures,
  useAddClinicalFile,
  useCompleteClinicalEncounter,
  useRemoveClinicalFile,
  useVoidClinicalEncounter,
} from "@/features/clinical-encounter/hooks/use-clinical-encounter-mutations";
import { useToasts } from "@/features/clinical-encounter/hooks/use-toasts";
import { ClinicalEncounterStateError } from "@/features/clinical-encounter/services/clinical-encounter.service";
import type {
  ClinicalEncounterProcedureDraft,
  ClinicalFile,
  ClinicalFileCategory,
  ClinicalFileUploadStatus,
  CompleteClinicalEncounterInput,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { durationLabel, formatDateOnly, formatDateTimeShort } from "@/features/clinical-encounter/utils/dates";
import {
  canAddProcedures,
  canComplete,
  canVoid,
  summarizeProcedures,
} from "@/features/clinical-encounter/utils/encounter-detail";
import { formatBytes } from "@/features/clinical-encounter/utils/format";
import { ProcedureValidationError } from "@/features/clinical-encounter/utils/procedures";

const READ_PERMISSION = "dentistry:encounters:read";
const UPDATE_PERMISSION = "dentistry:encounters:update";
const VOID_PERMISSION = "dentistry:encounters:void";

const fileCategoryLabels: Record<ClinicalFileCategory, string> = {
  RADIOGRAPH: "Radiografía",
  PHOTO: "Fotografía",
  DOCUMENT: "Documento",
  OTHER: "Otro",
};

const uploadStatusLabels: Record<ClinicalFileUploadStatus, string> = {
  PENDING: "Pendiente",
  READY: "Listo",
  FAILED: "Fallido",
};

const uploadStatusVariants: Record<ClinicalFileUploadStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  READY: "success",
  FAILED: "danger",
};

function encountersListHref(patientId: string): string {
  return `/patients/${encodeURIComponent(patientId)}/clinical-encounters`;
}

function isNotFoundError(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 404;
  return error instanceof Error && /no (se )?encontr/i.test(error.message);
}

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ClinicalEncounterStateError) return error.message;
  if (error instanceof ProcedureValidationError) return error.message;
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return "No se pudo completar la acción.";
}

function inferFileCategory(file: File): ClinicalFileCategory {
  const name = file.name.toLowerCase();
  if (/(rx|radio|pano|periap|bitewing|oclusal|cefalometric)/.test(name)) return "RADIOGRAPH";
  if (file.type.startsWith("image/")) return "PHOTO";
  if (file.type.startsWith("application/") || file.type.startsWith("text/")) return "DOCUMENT";
  return "OTHER";
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
  const { toasts, pushToast, dismissToast } = useToasts();

  const encounterQuery = useClinicalEncounter(patientId, encounterId);
  const filesQuery = useClinicalFiles(patientId, encounterId);
  const referenceQuery = useEncounterReferenceData(patientId);

  const completeMutation = useCompleteClinicalEncounter(patientId);
  const voidMutation = useVoidClinicalEncounter(patientId);
  const addProceduresMutation = useAddClinicalEncounterProcedures(patientId);
  const addFileMutation = useAddClinicalFile(patientId);
  const removeFileMutation = useRemoveClinicalFile(patientId);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [voidOpen, setVoidOpen] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [procedureOpen, setProcedureOpen] = useState(false);
  const [pendingRemovalId, setPendingRemovalId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const canUpdate = session.permissions.includes(UPDATE_PERMISSION);
  const canVoidEncounter = session.permissions.includes(VOID_PERMISSION);
  // Decisión (A): completar cierra el registro clínico, pero los metadatos de
  // archivos (adjuntar/quitar) siguen siendo gestionables con permiso de update.
  const canEditFiles = canUpdate && encounter.status !== "VOIDED";
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
        : (appointmentLabel ?? "No disponible")
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

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      await addFileMutation.mutateAsync({
        clinicalEncounterId: encounter.id,
        originalFilename: file.name,
        category: inferFileCategory(file),
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      pushToast("Archivo adjuntado (solo metadatos).", "success");
    } catch (error) {
      pushToast(mutationErrorMessage(error), "danger");
    }
  };

  const handleRemoveFile = async (file: ClinicalFile) => {
    try {
      await removeFileMutation.mutateAsync(file.id);
      setPendingRemovalId(null);
      pushToast("Archivo quitado.", "success");
    } catch (error) {
      pushToast(mutationErrorMessage(error), "danger");
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={`Atención del ${formatDateOnly(encounter.startedAt)}`}
        description={`${encounter.practitionerName ?? "Profesional sin asignar"} · ${encounter.branchName ?? "Sucursal sin asignar"}`}
        badge={<StatusBadge status={encounter.status} />}
        breadcrumbs={[
          { label: "Pacientes", href: "/patients" },
          { label: patient.fullName, href: `/patients/${encodeURIComponent(patient.id)}` },
          { label: "Atenciones clínicas", href: listHref },
          { label: `Atención ${formatDateOnly(encounter.startedAt)}` },
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
            Completada el {formatDateTimeShort(encounter.completedAt)} por{" "}
            {encounter.completedByName ?? "—"}. El registro clínico está cerrado; los metadatos de
            archivos siguen siendo gestionables.
          </p>
        </div>
      )}
      {encounter.status === "VOIDED" && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-warning">
          <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
          <p className="text-sm">
            Anulada el {formatDateTimeShort(encounter.voidedAt)} ·{" "}
            {encounter.voidReason ?? "Sin motivo registrado"}. La evidencia permanece en el historial.
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        <Panel id="ce-detail-summary" title="Resumen" icon={Icons.clock}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
            <InfoRow label="Estado" value={<StatusBadge status={encounter.status} />} />
            <InfoRow label="Inicio" value={formatDateTimeShort(encounter.startedAt)} />
            <InfoRow
              label="Fin"
              value={encounter.endedAt ? formatDateTimeShort(encounter.endedAt) : "—"}
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
                value={encounter.completedAt ? formatDateTimeShort(encounter.completedAt) : "—"}
              />
              <InfoRow label="Completada por" value={encounter.completedByName ?? "—"} />
            </div>
          )}

          {encounter.status === "VOIDED" && (
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-border pt-4 sm:grid-cols-3">
              <InfoRow
                label="Anulada el"
                value={encounter.voidedAt ? formatDateTimeShort(encounter.voidedAt) : "—"}
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

          <Panel
            id="ce-detail-files"
            title="Archivos"
            description="Solo se registran metadatos; los binarios no se suben desde aquí."
            icon={Icons.inventory}
            action={
              canEditFiles ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    aria-label="Seleccionar archivo para adjuntar"
                    onChange={(event) => { void handleFileSelected(event); }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={Icons.plus}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={addFileMutation.isPending}
                    loading={addFileMutation.isPending}
                  >
                    Adjuntar archivo
                  </Button>
                </>
              ) : undefined
            }
          >
            {filesQuery.isPending ? (
              <p role="status" className="text-sm text-muted">
                Cargando archivos…
              </p>
            ) : filesQuery.isError ? (
              <div role="alert" className="space-y-3 text-sm">
                <p className="text-foreground">No se pudieron cargar los archivos.</p>
                <Button variant="outline" size="sm" onClick={() => { void filesQuery.refetch(); }}>
                  Reintentar
                </Button>
              </div>
            ) : filesQuery.data.length === 0 ? (
              <EmptyState
                className="py-6"
                message="Sin archivos"
                description="Adjunta radiografías, fotografías o documentos de esta atención."
                icon={Icons.inventory}
              />
            ) : (
              <ul className="space-y-3">
                {filesQuery.data.map((file) => {
                  const confirmingRemoval = pendingRemovalId === file.id;

                  return (
                    <li
                      key={file.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface-subtle/60 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {file.originalFilename}
                        </p>
                        <p className="font-mono text-[10px] text-muted">
                          {fileCategoryLabels[file.category]} · {formatBytes(file.sizeBytes)} ·{" "}
                          {formatDateTimeShort(file.createdAt)}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant={uploadStatusVariants[file.uploadStatus]}>
                            {uploadStatusLabels[file.uploadStatus]}
                          </Badge>
                          {file.category === "RADIOGRAPH" && (
                            <Badge variant="primary">Radiografía</Badge>
                          )}
                        </div>
                      </div>

                      {canEditFiles && (
                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          {confirmingRemoval ? (
                            <>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => { void handleRemoveFile(file); }}
                                disabled={removeFileMutation.isPending}
                                loading={removeFileMutation.isPending}
                              >
                                Quitar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setPendingRemovalId(null)}
                                disabled={removeFileMutation.isPending}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPendingRemovalId(file.id)}
                            >
                              Quitar
                            </Button>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
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
