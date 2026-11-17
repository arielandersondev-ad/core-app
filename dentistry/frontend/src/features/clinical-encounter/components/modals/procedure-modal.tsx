"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Combobox,
  Icons,
  Input,
  ResponsiveModal,
  Select,
} from "@/shared/components/ui";
import { ClinicalEncounterTargetBadge } from "@/features/clinical-encounter/components/clinical-encounter-target-badge";
import type {
  ClinicalEncounterProcedureDraft,
  ClinicalEncounterTargetType,
  TreatmentProcedureOption,
} from "@/features/clinical-encounter/types/clinical-encounter";
import {
  ProcedureValidationError,
  targetOptions,
  toProcedureDrafts,
} from "@/features/clinical-encounter/utils/procedures";

export interface ProcedureModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (procedures: ClinicalEncounterProcedureDraft[]) => void;
  treatmentProcedures: TreatmentProcedureOption[];
  defaultTreatmentId?: string;
  submitting?: boolean;
}

interface ProcedurePreview {
  drafts: ClinicalEncounterProcedureDraft[];
  error: string | null;
}

export function ProcedureModal({
  open,
  onClose,
  onConfirm,
  treatmentProcedures,
  defaultTreatmentId,
  submitting = false,
}: ProcedureModalProps) {
  const [targetType, setTargetType] = useState<ClinicalEncounterTargetType>("TOOTH");
  const [toothNumber, setToothNumber] = useState("");
  const [targetDescription, setTargetDescription] = useState("");
  const [description, setDescription] = useState("");
  const [treatmentProcedureId, setTreatmentProcedureId] = useState("");

  const resetForm = useCallback(() => {
    setTargetType("TOOTH");
    setToothNumber("");
    setTargetDescription("");
    setDescription("");
    setTreatmentProcedureId("");
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const available = defaultTreatmentId
    ? treatmentProcedures.filter((item) => item.treatmentId === defaultTreatmentId)
    : treatmentProcedures;

  const options = [
    { value: "", label: "Sin vincular a un plan" },
    ...available.map((item) => ({ value: item.id, label: item.label })),
  ];

  const preview = useMemo<ProcedurePreview>(() => {
    try {
      return {
        drafts: toProcedureDrafts({
          targetType,
          toothNumber,
          targetDescription,
          description,
          treatmentProcedureId,
        }),
        error: null,
      };
    } catch (error) {
      return {
        drafts: [],
        error:
          error instanceof ProcedureValidationError
            ? error.message
            : "Revisa los datos del procedimiento.",
      };
    }
  }, [targetType, toothNumber, targetDescription, description, treatmentProcedureId]);

  const handleConfirm = () => {
    if (preview.error) return;
    onConfirm(preview.drafts);
    resetForm();
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={handleClose}
      title="Registrar procedimiento"
      description="Objetivo, descripción y vínculo opcional al plan de tratamiento."
      eyebrow="Acción realizada"
      icon={Icons.tooth}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={Icons.tooth}
            onClick={handleConfirm}
            disabled={submitting || Boolean(preview.error)}
            loading={submitting}
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
              const next = targetOptions.find((option) => option.value === event.target.value)?.value;
              if (!next) return;
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
          helperText="El vínculo se valida contra el plan de tratamiento del paciente."
        />
        <div className="rounded-lg border border-dashed border-border bg-surface-subtle px-3.5 py-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            Vista previa · {preview.drafts.length} fila(s)
          </p>
          {preview.error ? (
            <p role="alert" aria-live="polite" className="text-xs text-danger">
              {preview.error}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {preview.drafts.map((row, index) => (
                <li
                  key={`preview-${index}-${row.targetType}-${row.toothNumber ?? row.targetDescription ?? ""}`}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <ClinicalEncounterTargetBadge
                    targetType={row.targetType}
                    toothNumber={row.toothNumber}
                  />
                  <span className="truncate">{row.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </ResponsiveModal>
  );
}
