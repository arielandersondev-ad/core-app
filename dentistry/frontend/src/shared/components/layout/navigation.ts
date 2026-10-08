import type { ReactNode } from "react";
import { Icons } from "../icons/icons";

export type AppSection =
  | "dashboard"
  | "pacientes"
  | "agenda"
  | "servicios"
  | "tratamientos"
  | "pagos"
  | "inventario";

export const NAV_ITEMS: readonly {
  section: AppSection;
  label: string;
  href: string;
  icon: ReactNode;
  showInBottomNav?: boolean;
}[] = [
  {
    section: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Icons.dashboard,
    showInBottomNav: true,
  },
  {
    section: "pacientes",
    label: "Pacientes",
    href: "/patients",
    icon: Icons.patients,
    showInBottomNav: true,
  },
  {
    section: "agenda",
    label: "Agenda",
    href: "/agenda",
    icon: Icons.agenda,
    showInBottomNav: true,
  },
  {
    section: "servicios",
    label: "Servicios",
    href: "/services",
    icon: Icons.services,
    showInBottomNav: false,
  },
  {
    section: "tratamientos",
    label: "Tratamientos",
    href: "/treatments",
    icon: Icons.treatments,
    showInBottomNav: true,
  },
  {
    section: "pagos",
    label: "Pagos",
    href: "/payments",
    icon: Icons.payments,
    showInBottomNav: true,
  },
  {
    section: "inventario",
    label: "Inventario",
    href: "/inventory",
    icon: Icons.inventory,
    showInBottomNav: false,
  },
] as const;

export const SECTION_TITLES: Record<AppSection, string> = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  agenda: "Agenda",
  servicios: "Servicios Odontológicos",
  tratamientos: "Tratamientos",
  pagos: "Pagos",
  inventario: "Inventario",
};
