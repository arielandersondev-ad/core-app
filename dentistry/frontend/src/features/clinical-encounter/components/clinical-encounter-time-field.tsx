"use client";

import { Label, TimePicker } from "@/shared/components/ui";

export interface ClinicalEncounterTimeFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  disabled?: boolean;
}

export function ClinicalEncounterTimeField({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  disabled = false,
}: ClinicalEncounterTimeFieldProps) {
  const nativeId = `${id}-native`;

  return (
    <div>
      <div className="hidden md:block">
        <TimePicker
          id={id}
          label={label}
          value={value}
          onChange={onChange}
          pickerSize="md"
          error={error}
          hint={hint}
          disabled={disabled}
        />
      </div>
      <div className="space-y-1 md:hidden">
        <Label htmlFor={nativeId}>{label}</Label>
        <input
          id={nativeId}
          type="time"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${nativeId}-error` : hint ? `${nativeId}-hint` : undefined}
          className={`h-11 w-full rounded-md border bg-surface px-3 text-sm text-foreground transition-all focus:outline-none focus:ring-2 ${
            error
              ? "border-danger focus:border-danger focus:ring-danger/30"
              : "border-border focus:border-primary focus:ring-ring/30"
          }`}
        />
        {error ? (
          <p id={`${nativeId}-error`} className="text-[11px] text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${nativeId}-hint`} className="text-[11px] text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const TimeField = ClinicalEncounterTimeField;
