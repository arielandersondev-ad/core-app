"use client";

import { useState } from "react";
import { ReadonlyField } from "@app/ui";
import { Button, Combobox, Input, Label, Select, ResponsiveModal } from "@/shared/components/ui";
import type { ClinicalEncounter, ClinicalFile, EncounterProcedure, HealthProfile, TargetType } from "../types";
import { DateField, DemoTags, InfoRow, TargetBadge, TimeField } from "./demo-ui";
import { HEALTH_PROFILE_FIELDS, formatDateTimeShort, toDateInputValue, toTimeInputValue } from "./demo-store";
import styles from "./demo.module.css";

function nowDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function nowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function TextAreaField({
  id,
  label,
  hint,
  value,
  onChange,
  rows = 3,
  autoFocus = false,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
      />
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}

/* ── Completar atención ──────────────────────────────────────────────────── */

export function CompleteEncounterModal({
  open,
  encounter,
  onClose,
  onConfirm,
}: {
  open: boolean;
  encounter: ClinicalEncounter;
  onClose: () => void;
  onConfirm: (input: { date: string; time: string; procedureSummary: string }) => void;
}) {
  const [date, setDate] = useState(() => toDateInputValue(encounter.endedAt) || nowDate());
  const [time, setTime] = useState(() => toTimeInputValue(encounter.endedAt) || nowTime());
  const [summary, setSummary] = useState(encounter.procedureSummary ?? "");

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Completar atención"
      description="El cierre exige hora de fin y trazabilidad; no exige procedimientos."
      eyebrow="Cierre clínico"
      icon={DemoTags.check}
      maxWidth="max-w-xl"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" leftIcon={DemoTags.check} onClick={() => onConfirm({ date, time, procedureSummary: summary })}>
            Completar atención
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="Profesional que completa" value={encounter.professionalName} />
          <ReadonlyField label="Procedimientos registrados" value={String(encounter.procedures.length)} badge="filas" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField id="ce-complete-date" label="Fecha de cierre" value={date} onChange={setDate} />
          <TimeField id="ce-complete-time" label="Hora de cierre" value={time} onChange={setTime} />
        </div>
        <TextAreaField
          id="ce-complete-summary"
          label="Resumen de procedimientos (opcional)"
          hint="Texto narrativo. No se infiere de las filas registradas."
          value={summary}
          onChange={setSummary}
        />
        <p className="rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs text-muted">
          Una atención puede completarse con cero procedimientos. El estado completado bloquea la edición no permitida.
        </p>
      </div>
    </ResponsiveModal>
  );
}

/* ── Anular atención ─────────────────────────────────────────────────────── */

export function VoidEncounterModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  encounter?: ClinicalEncounter;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Anular atención"
      description="La anulación conserva la evidencia y el motivo en el historial."
      eyebrow="Transición de estado"
      icon={DemoTags.ban}
      maxWidth="max-w-lg"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Volver
          </Button>
          <Button variant="danger" leftIcon={DemoTags.ban} onClick={() => onConfirm(reason || "Sin motivo indicado")}>
            Anular atención
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-subtle px-3.5 py-3 text-warning">
          <span className="mt-0.5 shrink-0">{DemoTags.ban}</span>
          <p className="text-xs leading-relaxed">
            No se elimina historial clínico desde la interfaz. La fila anulada permanece visible y trazable.
          </p>
        </div>
        <TextAreaField
          id="ce-void-reason"
          label="Motivo de anulación"
          hint="Quedará registrado junto a la atención."
          value={reason}
          onChange={setReason}
          rows={3}
          autoFocus
        />
      </div>
    </ResponsiveModal>
  );
}

/* ── Registrar procedimiento ─────────────────────────────────────────────── */

export interface ProcedureFormValues {
  targetType: TargetType;
  toothNumber: string;
  targetDescription: string;
  description: string;
  treatmentProcedureId: string;
}

const targetOptions = [
  { value: "TOOTH", label: "Pieza dental (FDI)" },
  { value: "REGION", label: "Región" },
  { value: "WHOLE_MOUTH", label: "Boca completa" },
  { value: "OTHER", label: "Otro" },
];

/** Una acción con varias piezas se expande a una fila por pieza (regla del contrato). */
export function toProcedures(values: ProcedureFormValues): EncounterProcedure[] {
  const base = {
    description: values.description.trim() || "Procedimiento sin descripción",
    treatmentProcedureId: values.treatmentProcedureId || undefined,
  };

  if (values.targetType === "TOOTH") {
    const pieces = values.toothNumber
      .split(/[,\s]+/)
      .map((piece) => piece.trim())
      .filter(Boolean);
    if (pieces.length === 0) {
      return [{ id: `proc-${Date.now()}`, targetType: "TOOTH", description: base.description, treatmentProcedureId: base.treatmentProcedureId }];
    }
    return pieces.map((piece, index) => ({
      id: `proc-${Date.now()}-${index}`,
      targetType: "TOOTH" as const,
      toothNumber: piece,
      description: base.description,
      treatmentProcedureId: base.treatmentProcedureId,
    }));
  }

  return [
    {
      id: `proc-${Date.now()}`,
      targetType: values.targetType,
      targetDescription: values.targetDescription.trim() || undefined,
      description: base.description,
      treatmentProcedureId: base.treatmentProcedureId,
    },
  ];
}

export function ProcedureModal({
  open,
  defaultTreatmentId,
  treatmentProcedures,
  onClose,
  onConfirm,
}: {
  open: boolean;
  defaultTreatmentId?: string;
  treatmentProcedures: { id: string; label: string; treatmentId: string }[];
  onClose: () => void;
  onConfirm: (procedure: EncounterProcedure) => void;
}) {
  const [targetType, setTargetType] = useState<TargetType>("TOOTH");
  const [toothNumber, setToothNumber] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [description, setDescription] = useState("");
  const [treatmentProcedureId, setTreatmentProcedureId] = useState("");

  const available = defaultTreatmentId
    ? treatmentProcedures.filter((item) => item.treatmentId === defaultTreatmentId)
    : treatmentProcedures;

  const options = [{ value: "", label: "Sin vincular a un plan" }, ...available.map((item) => ({ value: item.id, label: item.label }))];

  const preview = toProcedures({ targetType, toothNumber, targetDescription, description, treatmentProcedureId });

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Registrar procedimiento"
      description="Objetivo, descripción y vínculo opcional al plan de tratamiento."
      eyebrow="Acción realizada"
      icon={DemoTags.pulse}
      maxWidth="max-w-xl"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={DemoTags.pulse}
            onClick={() => onConfirm(preview[0])}
          >
            Agregar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            id="ce-proc-target"
            label="Objetivo"
            value={targetType}
            onChange={(event) => {
              const next = event.target.value as TargetType;
              setTargetType(next);
              if (next !== "TOOTH") setToothNumber("");
              if (next === "TOOTH") setTargetDescription("");
            }}
            options={targetOptions}
          />
          {targetType === "TOOTH" ? (
            <Input
              id="ce-proc-tooth"
              label="Pieza FDI"
              placeholder="Ej. 16 o 16, 17"
              inputMode="numeric"
              enterKeyHint="done"
              value={toothNumber}
              onChange={(event) => setToothNumber(event.target.value)}
              hint="Varias piezas separadas por coma o espacio generan una fila por pieza."
            />
          ) : (
            <Input
              id="ce-proc-target-desc"
              label="Descripción del objetivo"
              placeholder="Ej. Cuadrante superior derecho"
              value={targetDescription}
              onChange={(event) => setTargetDescription(event.target.value)}
            />
          )}
        </div>
        <Input
          id="ce-proc-description"
          label="Descripción del procedimiento"
          placeholder="Ej. Obturación con resina compuesta"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Combobox
          id="ce-proc-link"
          label="Vínculo al plan (opcional)"
          options={options}
          value={treatmentProcedureId}
          onChange={setTreatmentProcedureId}
          searchPlaceholder="Buscar procedimiento del plan…"
          selectSize="md"
          clearable
          helperText="El backend valida que el procedimiento pertenece al mismo paciente y organización."
        />
        <div className="rounded-lg border border-dashed border-border bg-surface-subtle px-3.5 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">Vista previa · {preview.length} fila(s)</p>
          <ul className="space-y-1.5">
            {preview.map((row, index) => (
              <li key={`preview-${index}-${row.targetType}-${row.toothNumber ?? row.targetDescription ?? ""}`} className="flex items-center gap-2 text-xs text-foreground">
                <TargetBadge targetType={row.targetType} toothNumber={row.toothNumber} />
                <span className="truncate">{row.description}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ── Adjunto / radiografía ───────────────────────────────────────────────── */

export function FileModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (file: ClinicalFile) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ClinicalFile["category"]>("RADIOGRAPH");
  const [radiographType, setRadiographType] = useState("PANORAMIC");
  const [region, setRegion] = useState("");
  const [toothNumber, setToothNumber] = useState("");
  const [notes, setNotes] = useState("");

  const isRadiograph = category === "RADIOGRAPH";

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Adjuntar archivo"
      description="Solo metadatos en el prototipo: los binarios suben al almacenamiento autorizado."
      eyebrow="Adjuntos"
      icon={DemoTags.xray}
      maxWidth="max-w-xl"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={DemoTags.xray}
            onClick={() =>
              onConfirm({
                id: `file-${Date.now()}`,
                name: name.trim() || (isRadiograph ? "radiografia-sin-nombre.jpg" : "adjunto-sin-nombre.pdf"),
                category,
                mimeType: isRadiograph ? "image/jpeg" : "application/pdf",
                sizeBytes: isRadiograph ? 1_180_000 : 210_000,
                createdAt: new Date().toISOString(),
                radiographType: isRadiograph ? radiographType : undefined,
                region: isRadiograph ? region || undefined : undefined,
                toothNumber: isRadiograph ? toothNumber || undefined : undefined,
                notes: notes.trim() || undefined,
              })
            }
          >
            Adjuntar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="ce-file-name" label="Nombre del archivo" placeholder="Ej. panorámica-2026.jpg" value={name} onChange={(event) => setName(event.target.value)} />
          <Select
            id="ce-file-category"
            label="Categoría"
            value={category}
            onChange={(event) => setCategory(event.target.value as ClinicalFile["category"])}
            options={[
              { value: "RADIOGRAPH", label: "Radiografía" },
              { value: "ATTACHMENT", label: "Adjunto" },
            ]}
          />
        </div>

        <div className="rounded-lg border border-dashed border-border bg-surface-subtle px-4 py-6 text-center">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface text-muted">
            {DemoTags.file}
          </span>
          <p className="text-sm font-medium text-foreground">Arrastra o selecciona un archivo</p>
          <p className="mt-0.5 text-[11px] text-muted">El binario no se codifica en el prototipo; aquí solo se simulan los metadatos.</p>
        </div>

        {isRadiograph && (
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              id="ce-file-rx-type"
              label="Tipo"
              value={radiographType}
              onChange={(event) => setRadiographType(event.target.value)}
              options={[
                { value: "PANORAMIC", label: "Panorámica" },
                { value: "PERIAPICAL", label: "Periapical" },
                { value: "BITEWING", label: "Aleta de mordida" },
                { value: "OCCLUSAL", label: "Oclusal" },
                { value: "LATERAL", label: "Lateral" },
              ]}
            />
            <Input id="ce-file-rx-tooth" label="Pieza (opcional)" placeholder="Ej. 36" inputMode="numeric" enterKeyHint="done" value={toothNumber} onChange={(event) => setToothNumber(event.target.value)} />
            <Input id="ce-file-rx-region" label="Región (opcional)" placeholder="Ej. Maxilar superior" value={region} onChange={(event) => setRegion(event.target.value)} />
          </div>
        )}

        <TextAreaField id="ce-file-notes" label="Notas (opcional)" value={notes} onChange={setNotes} rows={2} />
      </div>
    </ResponsiveModal>
  );
}

/* ── Perfil de salud ─────────────────────────────────────────────────────── */

export function HealthProfileModal({
  open,
  profile,
  onClose,
  onConfirm,
}: {
  open: boolean;
  profile: HealthProfile;
  onClose: () => void;
  onConfirm: (profile: HealthProfile) => void;
}) {
  const [draft, setDraft] = useState<HealthProfile>(profile);

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Editar perfil de salud"
      description="Seis textos opcionales del perfil persistente. Vacío significa 'sin registrar'."
      eyebrow="Antecedentes"
      icon={DemoTags.pulse}
      maxWidth="max-w-2xl"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" leftIcon={DemoTags.check} onClick={() => onConfirm(draft)}>
            Guardar perfil
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {HEALTH_PROFILE_FIELDS.map((field) => (
          <TextAreaField
            key={field.key}
            id={`ce-health-${field.key}`}
            label={field.label}
            hint={field.hint}
            value={draft[field.key]}
            onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
            rows={2}
          />
        ))}
      </div>
    </ResponsiveModal>
  );
}

/* ── Revisión previa a la creación ───────────────────────────────────────── */

export function CreateEncounterReviewModal({
  open,
  patientName,
  branchName,
  professionalName,
  startedAtIso,
  appointmentLabel,
  treatmentLabel,
  examinationSummary,
  clinicalNotes,
  procedureSummary,
  procedures,
  submitting,
  onClose,
  onConfirm,
}: {
  open: boolean;
  patientName: string;
  branchName: string;
  professionalName: string;
  startedAtIso: string;
  appointmentLabel?: string;
  treatmentLabel?: string;
  examinationSummary: string;
  clinicalNotes: string;
  procedureSummary: string;
  procedures: EncounterProcedure[];
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Revisar antes de crear"
      description="Verifica los datos. Al confirmar se crea la atención en estado En curso."
      eyebrow="Confirmación"
      icon={DemoTags.check}
      maxWidth="max-w-2xl"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Volver
          </Button>
          <Button variant="primary" leftIcon={DemoTags.check} onClick={onConfirm} disabled={submitting}>
            {submitting ? "Iniciando…" : "Iniciar atención"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="Paciente" value={patientName} badge="fijo" />
          <ReadonlyField label="Inicio" value={formatDateTimeShort(startedAtIso)} />
          <ReadonlyField label="Sucursal" value={branchName} />
          <ReadonlyField label="Profesional" value={professionalName} />
          {appointmentLabel && <ReadonlyField label="Cita enlazada" value={appointmentLabel} />}
          {treatmentLabel && <ReadonlyField label="Tratamiento enlazado" value={treatmentLabel} />}
        </div>

        <div className="space-y-3 border-t border-border pt-4">
          <InfoRow label="Exploración" value={examinationSummary} />
          <InfoRow label="Notas clínicas" value={clinicalNotes} />
          <InfoRow label="Resumen de procedimientos" value={procedureSummary} />
        </div>

        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-muted">
            Procedimientos · {procedures.length}
          </p>
          {procedures.length === 0 ? (
            <p className="text-sm italic text-muted">Sin procedimientos. Está permitido iniciar sin filas.</p>
          ) : (
            <ul className="space-y-1.5">
              {procedures.map((procedure) => (
                <li key={procedure.id} className="flex items-center gap-2 text-sm text-foreground">
                  <TargetBadge targetType={procedure.targetType} toothNumber={procedure.toothNumber} />
                  <span className="truncate">{procedure.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}

/* ── Guardia de salida ───────────────────────────────────────────────────── */

export function DiscardEncounterModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="¿Descartar esta atención?"
      description="El prototipo guarda los datos solo en memoria: al salir se pierden."
      eyebrow="Salir sin guardar"
      icon={DemoTags.ban}
      maxWidth="max-w-md"
      className={styles.modalIn}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Seguir editando
          </Button>
          <Button variant="danger" leftIcon={DemoTags.ban} onClick={onConfirm}>
            Descartar y salir
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">
        No existe borrador persistente todavía. Puedes seguir editando o salir y perder lo que ingresaste en
        contexto, exploración, notas y procedimientos.
      </p>
    </ResponsiveModal>
  );
}
