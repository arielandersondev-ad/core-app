"use client";

import { useState } from "react";
import { Button, Icons, ResponsiveModal } from "@/shared/components/ui";
import { DateField } from "@/features/clinical-encounter/components/clinical-encounter-date-field";
import { TimeField } from "@/features/clinical-encounter/components/clinical-encounter-time-field";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";
import type {
  ClinicalEncounter,
  CompleteClinicalEncounterInput,
} from "@/features/clinical-encounter/types/clinical-encounter";
import { nowDateValue, nowTimeValue, toDateInputValue, toTimeInputValue } from "@/features/clinical-encounter/utils/dates";
import { buildCompleteInput } from "@/features/clinical-encounter/utils/encounter-detail";

export interface CompleteEncounterModalProps {
  open: boolean;
  encounter: ClinicalEncounter;
  onClose: () => void;
  onConfirm: (input: CompleteClinicalEncounterInput) => void;
  submitting?: boolean;
  error?: string | null;
}

export function CompleteEncounterModal({
  open,
  encounter,
  onClose,
  onConfirm,
  submitting = false,
  error,
}: CompleteEncounterModalProps) {
  const [date, setDate] = useState(() => toDateInputValue(encounter.endedAt) || nowDateValue());
  const [time, setTime] = useState(() => toTimeInputValue(encounter.endedAt) || nowTimeValue());
  const [summary, setSummary] = useState(encounter.procedureSummary ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleError = error ?? validationError;

  const handleConfirm = () => {
    const input = buildCompleteInput(date, time, summary);
    if (!input) {
      setValidationError("La fecha y la hora de fin no son válidas.");
      return;
    }

    setValidationError(null);
    onConfirm(input);
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Completar atención"
      description="El cierre exige una hora de fin válida; no exige procedimientos registrados."
      eyebrow="Cierre clínico"
      icon={Icons.check}
      maxWidth="max-w-xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            leftIcon={Icons.check}
            onClick={handleConfirm}
            disabled={submitting}
            loading={submitting}
          >
            Completar atención
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField
            id="ce-complete-date"
            label="Fecha de fin"
            value={date}
            onChange={(next) => {
              setDate(next);
              setValidationError(null);
            }}
            error={visibleError && !date ? "Indica la fecha de fin." : undefined}
          />
          <TimeField
            id="ce-complete-time"
            label="Hora de fin"
            value={time}
            onChange={(next) => {
              setTime(next);
              setValidationError(null);
            }}
            error={visibleError && !time ? "Indica la hora de fin." : undefined}
          />
        </div>

        <TextAreaField
          id="ce-complete-summary"
          label="Resumen de procedimientos (opcional)"
          hint="Texto narrativo. No se infiere de las filas registradas."
          value={summary}
          onChange={setSummary}
        />

        {visibleError && (
          <p role="alert" aria-live="polite" className="rounded-lg border border-danger/30 bg-danger-subtle px-3.5 py-2.5 text-xs text-danger">
            {visibleError}
          </p>
        )}

        <p className="rounded-lg border border-border bg-surface-subtle px-3 py-2 text-xs text-muted">
          Una atención puede completarse con cero procedimientos. Al completar, las acciones de
          registro quedan bloqueadas.
        </p>
      </div>
    </ResponsiveModal>
  );
}
