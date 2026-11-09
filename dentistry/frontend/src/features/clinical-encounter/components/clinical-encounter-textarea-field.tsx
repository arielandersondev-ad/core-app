"use client";

import { Label } from "@/shared/components/ui";

export interface ClinicalEncounterTextAreaFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  autoFocus?: boolean;
  error?: string;
}

export function ClinicalEncounterTextAreaField({
  id,
  label,
  hint,
  value,
  onChange,
  rows = 3,
  autoFocus = false,
  error,
}: ClinicalEncounterTextAreaFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-foreground transition-all placeholder:text-muted/60 focus:outline-none focus:ring-2 ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/30"
            : "border-border focus:border-primary focus:ring-ring/30"
        }`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const TextAreaField = ClinicalEncounterTextAreaField;
