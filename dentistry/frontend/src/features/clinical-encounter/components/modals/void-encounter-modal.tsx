"use client";

import { useState } from "react";
import { Button, Icons, ResponsiveModal } from "@/shared/components/ui";
import { TextAreaField } from "@/features/clinical-encounter/components/clinical-encounter-textarea-field";

export interface VoidEncounterModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
  error?: string | null;
}

export function VoidEncounterModal({
  open,
  onClose,
  onConfirm,
  submitting = false,
  error,
}: VoidEncounterModalProps) {
  const [reason, setReason] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleError = error ?? validationError;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setValidationError("El motivo de anulación es obligatorio.");
      return;
    }

    setValidationError(null);
    onConfirm(trimmed);
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Anular atención"
      description="La anulación conserva la evidencia y el motivo en el historial."
      eyebrow="Transición de estado"
      icon={Icons.alertTriangle}
      maxWidth="max-w-lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Volver
          </Button>
          <Button
            variant="danger"
            leftIcon={Icons.alertTriangle}
            onClick={handleConfirm}
            disabled={submitting}
            loading={submitting}
          >
            Anular atención
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-subtle px-3.5 py-3 text-warning">
          <span className="mt-0.5 shrink-0">{Icons.alertTriangle}</span>
          <p className="text-xs leading-relaxed">
            No se elimina historial clínico desde la interfaz. La atención anulada permanece visible y
            trazable.
          </p>
        </div>

        <TextAreaField
          id="ce-void-reason"
          label="Motivo de anulación"
          hint="Obligatorio. Quedará registrado junto a la atención."
          value={reason}
          onChange={(next) => {
            setReason(next);
            setValidationError(null);
          }}
          rows={3}
          autoFocus
        />

        {visibleError && (
          <p role="alert" aria-live="polite" className="rounded-lg border border-danger/30 bg-danger-subtle px-3.5 py-2.5 text-xs text-danger">
            {visibleError}
          </p>
        )}
      </div>
    </ResponsiveModal>
  );
}
