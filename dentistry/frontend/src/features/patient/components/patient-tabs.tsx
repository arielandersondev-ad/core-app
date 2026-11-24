"use client";

import Link from "next/link";
import { patientTabHref, type PatientTab } from "@/features/patient/utils/patient-tabs";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { isModuleEnabled } from "@/shared/plan/plan-access";

/**
 * Secciones del paciente. Cada una es una ruta, así que el enlace se puede compartir y el botón
 * "atrás" funciona. Solo aparecen las que el usuario puede usar (permiso y plan).
 */
export function PatientTabs({ patientId, active }: { patientId: string; active: PatientTab }) {
  const session = useAuthenticatedSession();
  const can = (permission: string) => session.permissions.includes(permission);

  const tabs: { key: PatientTab; label: string; visible: boolean }[] = [
    { key: "summary", label: "Resumen", visible: true },
    { key: "encounters", label: "Atenciones", visible: can("dentistry:encounters:read") },
    {
      key: "account",
      label: "Cuenta",
      visible: can("dentistry:treatments:read") && isModuleEnabled(session.plan, "treatments"),
    },
    { key: "health", label: "Salud", visible: can("dentistry:encounters:read") },
    { key: "files", label: "Archivos", visible: can("dentistry:files:read") && isModuleEnabled(session.plan, "files") },
  ];

  return (
    <nav aria-label="Secciones del paciente" className="-mx-1 mt-4 mb-5 overflow-x-auto overflow-y-hidden">
      <ul className="flex min-w-max gap-1 border-b border-border px-1">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => {
            const isActive = tab.key === active;
            return (
              <li key={tab.key}>
                <Link
                  href={patientTabHref(patientId, tab.key)}
                  aria-current={isActive ? "page" : undefined}
                  className={`-mb-px block border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted hover:border-border hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
      </ul>
    </nav>
  );
}
