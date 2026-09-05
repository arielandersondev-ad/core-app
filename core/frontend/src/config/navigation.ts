import type { NavigationItem } from "@/shared/navigation/navigation.types";

export const navigationItems = [
  {
    id: "dashboard",
    label: "Resumen",
    mobileLabel: "Inicio",
    href: "/dashboard",
    icon: "dashboard",
    match: "exact",
  },
  {
    id: "organizations",
    label: "Organizaciones",
    mobileLabel: "Org..",
    href: "/dashboard/organizations",
    icon: "organizations",
    match: "nested",
  },
  {
    id: "users",
    label: "Usuarios",
    mobileLabel: "Usu..",
    href: "/dashboard/users",
    icon: "users",
    match: "nested",
  },
  {
    id: "roles",
    label: "Roles y permisos",
    mobileLabel: "Roles",
    href: "/dashboard/roles",
    icon: "roles",
    match: "nested",
  },
] as const satisfies readonly NavigationItem[];

export type NavigationItemId = (typeof navigationItems)[number]["id"];