"use client";

import {
  Badge,
  Button,
  EmptyState,
  Icons,
} from "@/shared/components/ui";
import { PageHeader } from "./page-header";
import type { ClinicalEncounter, ClinicalFile, HealthProfile, Patient } from "../types";
import {
  durationLabel,
  formatBytes,
  formatDateOnly,
  formatDateTimeShort,
  statusLabels,
} from "./demo-store";
import { DemoTags, InfoRow, Panel, TargetBadge, TextBlock } from "./demo-ui";
import styles from "./demo.module.css";

export function EncounterDetailView({
  encounter,
  patient,
  healthProfile,
  files,
  appointments,
  treatments,
  treatmentProcedures,
  onBack,
  onComplete,
  onVoid,
  onAddProcedure,
  onAddFile,
  onRemoveFile,
  onOpenHealth,
}: {
  encounter: ClinicalEncounter;
  patient: Patient;
  healthProfile: HealthProfile;
  files: ClinicalFile[];
  appointments: { id: string; label: string }[];
  treatments: { id: string; label: string }[];
  treatmentProcedures: { id: string; label: string; treatmentId: string }[];
  onBack: () => void;
  onComplete: () => void;
  onVoid: () => void;
  onAddProcedure: () => void;
  onAddFile: () => void;
  onRemoveFile: (id: string) => void;
  onOpenHealth: () => void;
}) {
  const isOpen = encounter.status === "IN_PROGRESS";
  const appointmentLabel = appointments.find((item) => item.id === encounter.appointmentId)?.label;
  const treatmentLabel = treatments.find((item) => item.id === encounter.treatmentId)?.label;
  const hasAllergies = Boolean(healthProfile.allergies.trim());

  const timeline = [
    { title: "Atención iniciada", detail: formatDateTimeShort(encounter.startedAt), tone: "primary" as const },
    {
      title: `${encounter.procedures.length} procedimiento(s) registrado(s)`,
      detail: encounter.procedures.length ? encounter.procedures.map((row) => row.description).join(" · ") : "Sin procedimientos",
      tone: "neutral" as const,
    },
    encounter.status === "VOIDED"
      ? { title: "Atención anulada", detail: encounter.voidReason ?? "Sin motivo", tone: "warning" as const }
      : encounter.status === "COMPLETED"
        ? { title: "Atención completada", detail: `${formatDateTimeShort(encounter.endedAt)} · ${encounter.completedBy ?? "—"}`, tone: "success" as const }
        : { title: "Atención en curso", detail: "Pendiente de cierre", tone: "primary" as const },
  ];

  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 inline-flex items-center gap-1.5 py-2 text-sm text-primary transition-colors hover:underline"
      >
        <span className="inline-flex rotate-180">{Icons.chevronRight}</span>
        Volver al historial
      </button>

      <PageHeader
        title={`Atención del ${formatDateOnly(encounter.startedAt)}`}
        description={`${encounter.professionalName} · ${encounter.branchName}`}
        breadcrumbs={[{ label: patient.fullName }, { label: "Atenciones" }, { label: formatDateOnly(encounter.startedAt) }]}
        badge={<span>{statusLabels[encounter.status]}</span>}
        action={
          <div className="flex flex-wrap gap-2">
            {isOpen && (
              <Button variant="outline" leftIcon={DemoTags.pulse} onClick={onAddProcedure}>
                Registrar procedimiento
              </Button>
            )}
            {isOpen && (
              <Button variant="primary" leftIcon={DemoTags.check} onClick={onComplete}>
                Completar
              </Button>
            )}
            {encounter.status !== "VOIDED" && (
              <Button variant="outline" leftIcon={DemoTags.ban} onClick={onVoid}>
                Anular
              </Button>
            )}
          </div>
        }
      />

      {encounter.status === "COMPLETED" && (
        <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success-subtle px-4 py-3 text-success">
          <span className="mt-0.5 shrink-0">{DemoTags.check}</span>
          <p className="text-sm">
            Completada el {formatDateTimeShort(encounter.endedAt)} por {encounter.completedBy ?? "—"}. Las acciones no permitidas quedan bloqueadas.
          </p>
        </div>
      )}
      {encounter.status === "VOIDED" && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle px-4 py-3 text-warning">
          <span className="mt-0.5 shrink-0">{DemoTags.ban}</span>
          <p className="text-sm">Anulada · {encounter.voidReason ?? "Sin motivo"}. La evidencia permanece en el historial.</p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Panel id="ce-detail-procedures" title="Procedimientos realizados" description="Una fila por acción y ámbito (ClinicalEncounterProcedure)." icon={DemoTags.pulse}
            action={isOpen ? <Button size="sm" variant="outline" leftIcon={Icons.plus} onClick={onAddProcedure}>Agregar</Button> : undefined}
          >
            {encounter.procedures.length === 0 ? (
              <EmptyState
                className="py-6"
                message="Sin procedimientos registrados"
                description="Una atención puede completarse con cero procedimientos."
                icon={DemoTags.pulse}
                action={isOpen ? <Button size="sm" variant="outline" leftIcon={Icons.plus} onClick={onAddProcedure}>Registrar procedimiento</Button> : undefined}
              />
            ) : (
              <ul className="divide-y divide-border">
                {encounter.procedures.map((procedure, index) => {
                  const linked = treatmentProcedures.find((item) => item.id === procedure.treatmentProcedureId);
                  return (
                    <li
                      key={procedure.id}
                      className={`flex flex-wrap items-start gap-3 py-3 ${styles.rowIn}`}
                      style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                    >
                      <span className="mt-0.5 shrink-0"><TargetBadge targetType={procedure.targetType} toothNumber={procedure.toothNumber} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{procedure.description}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          {procedure.targetDescription ? `${procedure.targetDescription} · ` : ""}
                          {linked ? `Plan: ${linked.label}` : "Sin vínculo a plan"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel id="ce-detail-notes" title="Exploración y notas clínicas" icon={Icons.search}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextBlock label="Exploración" value={encounter.examinationSummary} />
              <TextBlock label="Resumen de procedimientos" value={encounter.procedureSummary} />
              <div className="sm:col-span-2">
                <TextBlock label="Notas clínicas" value={encounter.clinicalNotes} />
              </div>
            </div>
          </Panel>

          <Panel id="ce-detail-files" title="Adjuntos y radiografías" description="Solo metadatos y referencias de almacenamiento." icon={DemoTags.xray}
            action={encounter.status !== "VOIDED" ? <Button size="sm" variant="outline" leftIcon={Icons.plus} onClick={onAddFile}>Adjuntar</Button> : undefined}
          >
            {files.length === 0 ? (
              <EmptyState className="py-6" message="Sin archivos" description="Adjunta radiografías o documentos del paciente." icon={DemoTags.xray} />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {files.map((file, index) => (
                  <li
                    key={file.id}
                    className={`flex items-start gap-3 rounded-lg border border-border bg-surface-subtle/60 p-3 ${styles.rowIn}`}
                    style={{ animationDelay: `${Math.min(index * 50, 250)}ms` }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-muted">
                      {file.category === "RADIOGRAPH" ? DemoTags.xray : DemoTags.file}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                      <p className="font-mono text-[10px] text-muted">
                        {formatBytes(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString("es")}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge variant={file.category === "RADIOGRAPH" ? "primary" : "neutral"}>
                          {file.category === "RADIOGRAPH" ? "Radiografía" : "Adjunto"}
                        </Badge>
                        {file.radiographType && <Badge variant="neutral">{file.radiographType}</Badge>}
                        {file.toothNumber && <Badge variant="neutral">Pieza {file.toothNumber}</Badge>}
                      </div>
                      {file.notes && <p className="mt-1 text-xs text-muted">{file.notes}</p>}
                    </div>
                    {encounter.status !== "VOIDED" && (
                      <button
                        type="button"
                        onClick={() => onRemoveFile(file.id)}
                        aria-label={`Quitar ${file.name}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-subtle hover:text-danger md:h-9 md:w-9"
                      >
                        {DemoTags.trash}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel id="ce-detail-summary" title="Resumen" icon={Icons.clock}>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <InfoRow label="Inicio" value={formatDateTimeShort(encounter.startedAt)} />
              <InfoRow label="Fin" value={encounter.endedAt ? formatDateTimeShort(encounter.endedAt) : "—"} />
              <InfoRow label="Duración" value={durationLabel(encounter.startedAt, encounter.endedAt)} />
              <InfoRow label="Sucursal" value={encounter.branchName} />
              <InfoRow label="Profesional" value={encounter.professionalName} />
              <InfoRow label="Completada por" value={encounter.completedBy ?? "—"} />
              <InfoRow label="Cita enlazada" value={appointmentLabel ?? "Sin cita"} />
              <InfoRow label="Tratamiento" value={treatmentLabel ?? "Sin tratamiento"} />
            </dl>
          </Panel>

          <Panel id="ce-detail-timeline" title="Cronología" icon={Icons.clock}>
            <ol className="relative ml-1.5 space-y-4 border-l border-border pl-5">
              {timeline.map((item, index) => (
                <li key={index} className={`relative ${styles.rowIn}`} style={{ animationDelay: `${Math.min(index * 60, 240)}ms` }}>
                  <span
                    className={`absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full ${
                      item.tone === "success"
                        ? "bg-success"
                        : item.tone === "warning"
                          ? "bg-warning"
                          : item.tone === "primary"
                            ? "bg-primary"
                            : "bg-muted"
                    }`}
                  />
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel id="ce-detail-health" title="Perfil de salud" icon={DemoTags.pulse}
            action={<Button size="sm" variant="ghost" onClick={onOpenHealth}>Ver</Button>}
          >
            {hasAllergies ? (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-subtle px-3 py-2 text-danger">
                  <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
                  <p className="text-xs leading-relaxed"><span className="font-semibold">Alergias:</span> {healthProfile.allergies}</p>
                </div>
                <p className="text-xs text-muted">Antecedentes médicos: {healthProfile.medicalHistory || "Sin registrar"}</p>
              </div>
            ) : (
              <p className="text-xs text-muted">Sin alergias ni antecedentes registrados. Vacío significa "sin registrar", no "sin antecedentes".</p>
            )}
          </Panel>

          <p className="px-1 text-[11px] text-muted">
            Prototipo: atribución de identidad, organización y permisos la deriva el backend desde la sesión.
          </p>
        </div>
      </div>
    </>
  );
}
