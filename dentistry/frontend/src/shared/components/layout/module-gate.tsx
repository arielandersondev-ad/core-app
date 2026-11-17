"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { isModuleEnabled, moduleForPath } from "@/shared/plan/plan-access";
import { navItemsForPlan } from "./navigation";

/**
 * Oculta las pantallas de módulos que el plan no incluye. Es solo UX: el backend
 * rechaza igualmente las operaciones de módulos no contratados.
 */
export function ModuleGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { plan } = useAuthenticatedSession();
  const pathModule = moduleForPath(pathname);
  const blocked = pathModule !== null && !isModuleEnabled(plan, pathModule);
  const fallbackHref = navItemsForPlan(plan)[0]?.href ?? null;
  // El dashboard es la entrada por defecto: si no está en el plan se pasa al primer módulo disponible.
  const redirectToFallback = blocked && pathModule === "dashboard" && fallbackHref !== null;

  useEffect(() => {
    if (redirectToFallback && fallbackHref) router.replace(fallbackHref);
  }, [fallbackHref, redirectToFallback, router]);

  if (!blocked) return <>{children}</>;
  if (redirectToFallback) return null;

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <h1 className="font-display text-lg font-semibold text-foreground">No incluido en tu plan</h1>
        <p className="mt-2 text-sm text-muted">
          {plan
            ? "Este módulo no forma parte del plan de tu organización. Mejora tu plan para habilitarlo."
            : "Tu organización no tiene un plan vigente. Contacta al administrador."}
        </p>
        {fallbackHref && (
          <Link
            href={fallbackHref}
            className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Ir a un módulo disponible
          </Link>
        )}
      </div>
    </div>
  );
}
