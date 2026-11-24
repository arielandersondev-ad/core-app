import type { ReactNode } from "react";
import { Icons } from "../icons/icons";
import { isModuleEnabled, type DentistryModule, type SessionPlan } from "@/shared/plan/plan-access";

export type AppSection =
  | "dashboard"
  | "pacientes"
  | "agenda"
  | "servicios"
  | "inventario";

export const NAV_ITEMS: readonly {
  section: AppSection;
  module: DentistryModule;
  label: string;
  href: string;
  icon: ReactNode;
  showInBottomNav?: boolean;
}[] = [
  {
    section: "dashboard",
    module: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: Icons.dashboard,
    showInBottomNav: true,
  },
  {
    section: "pacientes",
    module: "patients",
    label: "Pacientes",
    href: "/patients",
    icon: Icons.patients,
    showInBottomNav: true,
  },
  {
    section: "agenda",
    module: "agenda",
    label: "Agenda",
    href: "/agenda",
    icon: Icons.agenda,
    showInBottomNav: true,
  },
  {
    section: "servicios",
    module: "services",
    label: "Servicios",
    href: "/services",
    icon: Icons.services,
    showInBottomNav: false,
  },
  {
    section: "inventario",
    module: "inventory",
    label: "Inventario",
    href: "/inventory",
    icon: Icons.inventory,
    showInBottomNav: false,
  },
] as const;

/** Ítems de navegación incluidos en el plan de la organización. */
export function navItemsForPlan(plan: SessionPlan | null) {
  return NAV_ITEMS.filter((item) => isModuleEnabled(plan, item.module));
}

export const SECTION_TITLES: Record<AppSection, string> = {
  dashboard: "Dashboard",
  pacientes: "Pacientes",
  agenda: "Agenda",
  servicios: "Servicios Odontológicos",
  inventario: "Inventario",
};
