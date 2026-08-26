import type { ReactNode } from "react";
import { Icons } from "../icons/icons";

export type AppSection =
  | "dashboard"
  | "pacientes"
  | "agenda"
  | "tratamientos"
  | "pagos"
  | "inventario";

export const NAV_ITEMS: readonly {
  section: AppSection;
  label: string;
  href: string;
  icon: ReactNode;
}[] = [
  { section: "dashboard",   label: "Dashboard",   href: "/dashboard",              icon: Icons.dashboard },
  { section: "pacientes",   label: "Pacientes",   href: "/dashboard/patient",    icon: Icons.patients },
  { section: "agenda",      label: "Agenda",      href: "/dashboard/agenda",       icon: Icons.agenda },
  { section: "tratamientos",label: "Tratamientos",href: "/dashboard/tratamientos", icon: Icons.treatments },
  { section: "pagos",       label: "Pagos",       href: "/dashboard/pagos",        icon: Icons.payments },
  { section: "inventario",  label: "Inventario",  href: "/dashboard/inventario",   icon: Icons.inventory },
] as const;

export const SECTION_TITLES: Record<AppSection, string> = {
  dashboard:   "Dashboard",
  pacientes:   "Pacientes",
  agenda:      "Agenda",
  tratamientos:"Tratamientos",
  pagos:       "Pagos",
  inventario:  "Inventario",
};
