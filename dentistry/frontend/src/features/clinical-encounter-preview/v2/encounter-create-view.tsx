"use client";

import { useMemo, useState } from "react";
//import { ReadonlyField } from "@app/ui";
import {
  Badge,
  Button,
  Combobox,
  EmptyState,
  Icons,
  Select,
} from "@/shared/components/ui";
import { PageHeader } from "./page-header";
import type { EncounterProcedure, Patient } from "../types";
import {
  CreateEncounterReviewModal,
  DiscardEncounterModal,
  ProcedureModal,
  TextAreaField,
} from "./demo-modals";
import { buildInstant, type EncounterDraft } from "./demo-store";
import { DateField, DemoTags, Panel, TargetBadge, TimeField } from "./demo-ui";
import styles from "./demo.module.css";

function todayValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function nowValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function EncounterCreateView({
  patient,
  branches,
  professionals,
  appointments,
  treatments,
  treatmentProcedures,
  onCancel,
  onSubmit,
}: {
  patient: Patient;
  branches: string[];
  professionals: string[];
  appointments: { id: string; label: string }[];
  treatments: { id: string; label: string }[];
  treatmentProcedures: { id: string; label: string; treatmentId: string }[];
  onCancel: () => void;
  onSubmit: (draft: EncounterDraft) => void;
}) {
  const defaults = useMemo(
    () => ({
      branchName: branches[0] ?? "",
      professionalName: professionals[0] ?? "",
      startDate: todayValue(),
      startTime: nowValue(),
    }),
    [branches, professionals],
  );

  const [branchName, setBranchName] = useState(defaults.branchName);
  const [professionalName, setProfessionalName] = useState(defaults.professionalName);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [appointmentId, setAppointmentId] = useState("");
  const [treatmentId, setTreatmentId] = useState("");
  const [examinationSummary, setExaminationSummary] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [procedureSummary, setProcedureSummary] = useState("");
  const [procedures, setProcedures] = useState<EncounterProcedure[]>([]);

  const [showOptional, setShowOptional] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [procedureModalOpen, setProcedureModalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const availablePlanProcedures = treatmentId
    ? treatmentProcedures.filter((item) => item.treatmentId === treatmentId)
    : treatmentProcedures;

  const appointmentLabel = appointments.find((item) => item.id === appointmentId)?.label;
  const treatmentLabel = treatments.find((item) => item.id === treatmentId)?.label;
  const planLabel = (id?: string) => treatmentProcedures.find((item) => item.id === id)?.label;

  const hasExamination = examinationSummary.trim().length > 0;
  const isDirty =
    branchName !== defaults.branchName ||
    professionalName !== defaults.professionalName ||
    startDate !== defaults.startDate ||
    startTime !== defaults.startTime ||
    appointmentId !== "" ||
    treatmentId !== "" ||
    hasExamination ||
    clinicalNotes.trim() !== "" ||
    procedureSummary.trim() !== "" ||
    procedures.length > 0;

  const requestExit = () => {
    if (isDirty) setDiscardOpen(true);
    else onCancel();
  };

  const removeProcedure = (id: string) => {
    setProcedures((current) => current.filter((item) => item.id !== id));
  };

  const buildDraft = (): EncounterDraft => ({
    branchName,
    professionalName,
    startDate,
    startTime,
    appointmentId,
    treatmentId,
    examinationSummary,
    clinicalNotes,
    procedureSummary,
    procedures,
  });

  const handleConfirm = () => {
    setSubmitting(true);
    const draft = buildDraft();
    window.setTimeout(() => onSubmit(draft), 450);
  };

  const checks = [
    { label: "Contexto", done: true },
    { label: "Exploración", done: hasExamination },
  ];

  return (
    <>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <button
          type="button"
          onClick={requestExit}
          className="inline-flex items-center gap-1.5 py-2 text-sm text-primary transition-colors hover:underline"
        >
          <span className="inline-flex rotate-180">{Icons.chevronRight}</span>
          Volver al historial
        </button>

        <PageHeader
          title="Nueva atención clínica"
          description="Registra el inicio de la atención. El prototipo no valida ni persiste."
          breadcrumbs={[{ label: patient.fullName }, { label: "Atenciones" }, { label: "Nueva" }]}
          badge={<span>Nuevo</span>}
        />

        <p className="text-xs text-muted">Los campos con * son obligatorios.</p>

        <Panel
          id="ce-create-context"
          title="Contexto de la atención"
          description="Paciente, sede y profesional de la atención."
          icon={Icons.branch}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {/* <ReadonlyField label="Paciente" value={patient.fullName} badge="fijo" /> */}
            <input  value={patient.fullName}  /> 
            <Select
              id="ce-create-branch"
              label="Sucursal *"
              value={branchName}
              onChange={(event) => setBranchName(event.target.value)}
              options={branches.map((branch) => ({ value: branch, label: branch }))}
            />
            <Select
              id="ce-create-professional"
              label="Profesional *"
              value={professionalName}
              onChange={(event) => setProfessionalName(event.target.value)}
              options={professionals.map((professional) => ({ value: professional, label: professional }))}
            />
          </div>

          <div className="mt-4 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setShowOptional((value) => !value)}
              aria-expanded={showOptional}
              className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <span className={`inline-flex transition-transform ${showOptional ? "rotate-90" : ""}`}>
                  {Icons.chevronRight}
                </span>
                Referencias opcionales (cita y tratamiento)
              </span>
              {!showOptional && (appointmentLabel || treatmentLabel) && (
                <Badge variant="neutral" size="sm">
                  {appointmentLabel ?? treatmentLabel}
                </Badge>
              )}
            </button>
            {showOptional && (
              <div className={`mt-3 grid gap-4 sm:grid-cols-2 ${styles.rowIn}`}>
                <Combobox
                  id="ce-create-appointment"
                  label="Cita enlazada (opcional)"
                  options={[
                    { value: "", label: "Sin cita enlazada" },
                    ...appointments.map((item) => ({ value: item.id, label: item.label })),
                  ]}
                  value={appointmentId}
                  onChange={setAppointmentId}
                  selectSize="md"
                  clearable
                />
                <Combobox
                  id="ce-create-treatment"
                  label="Tratamiento enlazado (opcional)"
                  options={[
                    { value: "", label: "Sin tratamiento enlazado" },
                    ...treatments.map((item) => ({ value: item.id, label: item.label })),
                  ]}
                  value={treatmentId}
                  onChange={setTreatmentId}
                  selectSize="md"
                  clearable
                  helperText="Filtra los procedimientos disponibles del plan."
                />
              </div>
            )}
          </div>
        </Panel>

        <Panel
          id="ce-create-attention"
          title="Atención"
          description="Inicio, exploración y observaciones clínicas."
          icon={Icons.clock}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DateField id="ce-create-date" label="Fecha de inicio *" value={startDate} onChange={setStartDate} />
            <TimeField id="ce-create-time" label="Hora de inicio *" value={startTime} onChange={setStartTime} />
          </div>
          <div className="mt-4 space-y-4">
            <TextAreaField
              id="ce-create-examination"
              label="Exploración *"
              value={examinationSummary}
              onChange={setExaminationSummary}
              rows={4}
              hint="Hallazgos observados durante la atención."
            />
            <TextAreaField
              id="ce-create-notes"
              label="Notas clínicas (opcional)"
              value={clinicalNotes}
              onChange={setClinicalNotes}
              rows={3}
            />
          </div>
        </Panel>

        <Panel
          id="ce-create-procedures"
          title="Procedimientos realizados"
          description="Una acción con varias piezas se expande a una fila por pieza."
          icon={DemoTags.pulse}
          action={
            <Button size="sm" variant="outline" leftIcon={Icons.plus} onClick={() => setProcedureModalOpen(true)}>
              Agregar
            </Button>
          }
        >
          {procedures.length === 0 ? (
            <EmptyState
              className="py-6"
              message="Aún no hay procedimientos"
              description="Puedes iniciar y completar la atención sin procedimientos."
              icon={DemoTags.pulse}
              action={
                <Button size="sm" variant="outline" leftIcon={Icons.plus} onClick={() => setProcedureModalOpen(true)}>
                  Registrar procedimiento
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {procedures.map((procedure) => (
                <li key={procedure.id} className={`flex flex-wrap items-center gap-3 py-3 ${styles.rowIn}`}>
                  <TargetBadge targetType={procedure.targetType} toothNumber={procedure.toothNumber} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{procedure.description}</p>
                    <p className="text-xs text-muted">
                      {planLabel(procedure.treatmentProcedureId)
                        ? `Plan: ${planLabel(procedure.treatmentProcedureId)}`
                        : "Sin vínculo a plan"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProcedure(procedure.id)}
                    aria-label="Quitar procedimiento"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-danger-subtle hover:text-danger md:h-9 md:w-9"
                  >
                    {DemoTags.trash}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          id="ce-create-summary"
          title="Resumen del cierre"
          description="Narrativa opcional; no se infiere de las filas."
          icon={DemoTags.file}
          action={
            <button
              type="button"
              onClick={() => setShowSummary((value) => !value)}
              aria-expanded={showSummary}
              className="inline-flex items-center gap-1.5 py-1 text-xs font-medium text-muted transition-colors hover:text-foreground"
            >
              <span className={`inline-flex transition-transform ${showSummary ? "rotate-90" : ""}`}>
                {Icons.chevronRight}
              </span>
              {showSummary ? "Ocultar" : "Agregar"}
              {!showSummary && procedureSummary.trim() && (
                <Badge variant="neutral" size="sm">
                  Con texto
                </Badge>
              )}
            </button>
          }
        >
          {showSummary ? (
            <TextAreaField
              id="ce-create-procedure-summary"
              label="Resumen de procedimientos (opcional)"
              value={procedureSummary}
              onChange={setProcedureSummary}
              rows={3}
            />
          ) : (
            <p className="text-xs text-muted">
              Colapsado por defecto. Es opcional: puedes iniciar la atención sin escribir este resumen.
              {procedureSummary.trim() ? " Ya tiene texto guardado." : ""}
            </p>
          )}
        </Panel>

        <div className="sticky bottom-3 z-20">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-lg backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              {checks.map((check) => (
                <Badge key={check.label} variant={check.done ? "success" : "neutral"} size="sm" dot>
                  {check.label}
                </Badge>
              ))}
              <Badge variant="neutral" size="sm">
                Procedimientos: {procedures.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={requestExit}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1 sm:flex-none"
                leftIcon={DemoTags.check}
                onClick={() => setReviewOpen(true)}
                disabled={submitting}
              >
                Revisar y crear
              </Button>
            </div>
          </div>
        </div>
      </div>

      {procedureModalOpen && (
        <ProcedureModal
          open
          defaultTreatmentId={treatmentId || undefined}
          treatmentProcedures={availablePlanProcedures}
          onClose={() => setProcedureModalOpen(false)}
          onConfirm={(procedure) => {
            setProcedures((current) => [...current, procedure]);
            setProcedureModalOpen(false);
          }}
        />
      )}

      {reviewOpen && (
        <CreateEncounterReviewModal
          open
          patientName={patient.fullName}
          branchName={branchName}
          professionalName={professionalName}
          startedAtIso={buildInstant(startDate, startTime)}
          appointmentLabel={appointmentLabel}
          treatmentLabel={treatmentLabel}
          examinationSummary={examinationSummary}
          clinicalNotes={clinicalNotes}
          procedureSummary={procedureSummary}
          procedures={procedures}
          submitting={submitting}
          onClose={() => setReviewOpen(false)}
          onConfirm={handleConfirm}
        />
      )}

      {discardOpen && (
        <DiscardEncounterModal
          open
          onClose={() => setDiscardOpen(false)}
          onConfirm={onCancel}
        />
      )}
    </>
  );
}
