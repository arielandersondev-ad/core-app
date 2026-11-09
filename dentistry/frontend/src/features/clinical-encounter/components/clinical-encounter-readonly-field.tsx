import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui";

export interface ClinicalEncounterReadonlyFieldProps {
  label: string;
  value: ReactNode;
  badge?: string;
  mono?: boolean;
  className?: string;
}

export function ClinicalEncounterReadonlyField({
  label,
  value,
  badge,
  mono = false,
  className = "",
}: ClinicalEncounterReadonlyFieldProps) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>
          {isEmpty ? "—" : value}
        </p>
        {badge && <Badge variant="neutral">{badge}</Badge>}
      </div>
    </div>
  );
}

export const ReadonlyField = ClinicalEncounterReadonlyField;
