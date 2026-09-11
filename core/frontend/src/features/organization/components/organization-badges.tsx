import { Badge, type BadgeVariant } from "@/shared/components/ui";
import type {
  OrganizationPlan,
  OrganizationStatus,
} from "../types/organization";

type BadgeConfiguration = {
  label: string;
  variant: BadgeVariant;
};

const statusConfiguration = {
  active: {
    label: "Activo",
    variant: "success",
  },
  inactive: {
    label: "Inactivo",
    variant: "warning",
  },
} satisfies Record<OrganizationStatus, BadgeConfiguration>;

const planConfiguration = {
  starter: {
    label: "Starter",
    variant: "neutral",
  },
  professional: {
    label: "Profesional",
    variant: "warning",
  },
  enterprise: {
    label: "Enterprise",
    variant: "primary",
  },
} satisfies Record<OrganizationPlan, BadgeConfiguration>;

type OrganizationStatusBadgeProps = {
  status: OrganizationStatus;
};

export function OrganizationStatusBadge({
  status,
}: OrganizationStatusBadgeProps) {
  const configuration = statusConfiguration[status];

  return (
    <Badge
      variant={configuration.variant}
      dot
      className="uppercase tracking-[0.08em]"
    >
      {configuration.label}
    </Badge>
  );
}

type OrganizationPlanBadgeProps = {
  plan: OrganizationPlan;
};

export function OrganizationPlanBadge({ plan }: OrganizationPlanBadgeProps) {
  const configuration = planConfiguration[plan];

  return (
    <Badge variant={configuration.variant} className="tracking-[0.04em]">
      {configuration.label}
    </Badge>
  );
}
