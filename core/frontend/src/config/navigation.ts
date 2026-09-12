import type { NavigationItem } from "@/shared/navigation/navigation.types";

export const navigationItems = [
  {
    id: "dashboard",
    label: "Resumen",
    mobileLabel: "Inicio",
    href: "/dashboard",
    aliases: ["/"],
    icon: "dashboard",
    match: "exact",
  },
  {
    id: "organizations",
    label: "Organizaciones",
    mobileLabel: "Org..",
    href: "/organizations",
    icon: "organizations",
    match: "nested",
  },
  {
    id: "users",
    label: "Usuarios",
    mobileLabel: "Usu..",
    href: "/users",
    icon: "users",
    match: "nested",
  },
  {
    id: "roles",
    label: "Roles y permisos",
    mobileLabel: "Roles",
    href: "/roles",
    icon: "roles",
    match: "nested",
  },
  {
    id: "settings",
    label: "Configuración",
    mobileLabel: "Config.",
    href: "/settings",
    icon: "settings",
    match: "nested",
  },
] as const satisfies readonly NavigationItem[];

export type NavigationItemId = (typeof navigationItems)[number]["id"];
