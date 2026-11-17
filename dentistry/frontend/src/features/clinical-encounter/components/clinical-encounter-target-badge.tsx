import { Badge, type BadgeVariant } from "@/shared/components/ui";
import type { ClinicalEncounterTargetType } from "@/features/clinical-encounter/types/clinical-encounter";
import { targetTypeLabels } from "@/features/clinical-encounter/utils/procedures";

const targetVariant: Record<ClinicalEncounterTargetType, BadgeVariant> = {
  TOOTH: "primary",
  REGION: "neutral",
  WHOLE_MOUTH: "neutral",
  OTHER: "neutral",
};

export interface ClinicalEncounterTargetBadgeProps {
  targetType: ClinicalEncounterTargetType;
  toothNumber?: string;
}

export function ClinicalEncounterTargetBadge({
  targetType,
  toothNumber,
}: ClinicalEncounterTargetBadgeProps) {
  const suffix = targetType === "TOOTH" && toothNumber ? ` · ${toothNumber}` : "";

  return (
    <Badge variant={targetVariant[targetType]}>
      {targetTypeLabels[targetType]}
      {suffix}
    </Badge>
  );
}

export const TargetBadge = ClinicalEncounterTargetBadge;
