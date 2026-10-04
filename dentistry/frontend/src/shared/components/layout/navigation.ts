import type { ReactNode } from "react";
import { Icons } from "../icons/icons";

export type AppSection =
  | "dashboard"
  | "pacientes"
  | "agenda"
  | "tratamientos"
  | "pagos"
  | "inventario";

export type SectionTab = {
  label: string;
  href: string;
  exact?: boolean;
};

export const NAV_ITEMS: readonly {
  section: AppSection;
  label: string;
  href: string;
  icon: ReactNode;
}[] = [
  {
    section: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Icons.dashboard,
  },
  {
    section: "pacientes",
    label: "Pacientes",
    href: "/patients",
    icon: Icons.patients,
  },
  { section: "agenda", label: "Agenda", href: "/agenda", icon: Icons.agenda },
  {
    section: "tratamientos",
    label: "Tratamientos",
    href: "/treatments",
    icon: Icons.treatments,
  },
  { section: "pagos", label: "Pagos", href: "/payments", icon: Icons.payments },
  {
    section: "inventario",
    label: "Inventario",
    href: "/inventory",
    icon: Icons.inventory,
  },
] as const;

export const SECTION_TITLES: Record<AppSection, string> = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  agenda: "Agenda",
  tratamientos: "Tratamientos",
  pagos: "Pagos",
  inventario: "Inventario",
};

export const SECTION_TABS: Partial<Record<AppSection, readonly SectionTab[]>> = {
  tratamientos: [
    { label: "Tratamientos", href: "/treatments", exact: true },
    { label: "Consultas", href: "/treatments/consultations" },
  ],
};
