import type { ComponentType, SVGProps } from "react";
import type { NavigationIcon as NavigationIconName, } from "@/shared/navigation/navigation.types";

type IconProps = SVGProps<SVGSVGElement>;

function DashboardIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function OrganizationsIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4" />
      <path d="M8 11h4" />
      <path d="M8 15h4" />
      <path d="M2 21h20" />
    </svg>
  );
}

function UsersIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="8" r="4" />
      <path d="M3 21v-2a6 6 0 0 1 6-6" />
      <path d="M16 3.5a4 4 0 0 1 0 7.5" />
      <path d="M16 14a5 5 0 0 1 5 5v2" />
    </svg>
  );
}

function RolesIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

const iconComponents = {
  dashboard: DashboardIcon,
  organizations: OrganizationsIcon,
  users: UsersIcon,
  roles: RolesIcon,
} satisfies Record<NavigationIconName, ComponentType<IconProps>>;

type NavigationIconProps = IconProps & {
  name: NavigationIconName;
};

export function NavigationIcon({
  name,
  ...props
}: NavigationIconProps) {
  const Icon = iconComponents[name];

  return (
    <Icon
      aria-hidden="true"
      focusable="false"
      {...props}
    />
  );
}