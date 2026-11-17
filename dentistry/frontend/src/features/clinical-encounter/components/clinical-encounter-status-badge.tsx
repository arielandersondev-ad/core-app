import { Badge, type BadgeVariant } from "@/shared/components/ui";
import type { ClinicalEncounterStatus } from "@/features/clinical-encounter/types/clinical-encounter";

export const clinicalEncounterStatusLabels: Record<ClinicalEncounterStatus, string> = {
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  VOIDED: "Anulada",
};

const statusVariant: Record<ClinicalEncounterStatus, BadgeVariant> = {
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  VOIDED: "neutral",
};

export interface ClinicalEncounterStatusBadgeProps {
  status: ClinicalEncounterStatus;
  size?: "sm" | "md";
}

export function ClinicalEncounterStatusBadge({
  status,
  size = "sm",
}: ClinicalEncounterStatusBadgeProps) {
  return (
    <Badge variant={statusVariant[status]} dot size={size}>
      {clinicalEncounterStatusLabels[status]}
    </Badge>
  );
}

export const StatusBadge = ClinicalEncounterStatusBadge;
