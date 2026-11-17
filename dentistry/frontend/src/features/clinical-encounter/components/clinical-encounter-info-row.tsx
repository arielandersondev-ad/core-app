import type { ReactNode } from "react";

export interface ClinicalEncounterInfoRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

export function ClinicalEncounterInfoRow({ label, value, mono = false }: ClinicalEncounterInfoRowProps) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <dl className="min-w-0 space-y-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</dt>
      <dd className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {isEmpty ? "—" : value}
      </dd>
    </dl>
  );
}

export const InfoRow = ClinicalEncounterInfoRow;
