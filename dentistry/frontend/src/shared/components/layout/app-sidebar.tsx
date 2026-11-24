"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, navItemsForPlan } from "./navigation";
import { BrandMark } from "./brand-mark";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { organizationDisplayName } from "@/shared/session/display-names";

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";
const ACTIVE_TINT = "bg-[color-mix(in_oklab,var(--primary)_13%,transparent)]";
const HOVER_TINT = "hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]";

const logoutIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

/**
 * Navegación lateral desde 768 px, en un solo panel translúcido con un
 * degradado del color principal que nace detrás de la organización:
 * - 768–1279 px (tablet y escritorio estrecho): riel de 96 px con icono y
 *   etiqueta corta debajo; deja el ancho para el contenido.
 * - ≥ 1280 px: sidebar de 240 px con el nombre de la organización.
 */
export function AppSidebar() {
  const pathname = usePathname();
  const session = useAuthenticatedSession();
  const { plan } = session;
  const organizationName = organizationDisplayName(session);

  return (
    <aside className="flex w-24 flex-shrink-0 flex-col border-r border-border/60 bg-linear-to-b from-primary/15 via-surface/60 via-40% to-surface/55 backdrop-blur-xl backdrop-saturate-150 xl:w-60">
      {/* Organización: misma altura que la barra superior para alinear ambas */}
      <Link
        href="/dashboard"
        aria-label={`${organizationName}: ir al inicio`}
        title={organizationName}
        className={`mx-auto mt-[env(safe-area-inset-top)] flex h-[var(--shell-top-bar)] items-center gap-3 rounded-xl px-2 xl:mx-3 ${FOCUS_RING}`}
      >
        <BrandMark />
        <span className="hidden min-w-0 font-display text-sm font-semibold leading-tight text-foreground xl:line-clamp-2">
          {organizationName}
        </span>
      </Link>

      {/* Nav */}
      <nav aria-label="Navegación principal" className="flex flex-1 flex-col gap-1 overflow-y-auto px-1.5 pt-4 pb-3 xl:px-3">
        {navItemsForPlan(plan).map(({ section, label, href, icon }) => {
          const active = isNavItemActive(pathname, href);

          return (
            <Link
              key={section}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={`relative flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 font-display transition-colors xl:min-h-0 xl:h-10 xl:flex-row xl:justify-start xl:gap-3 xl:rounded-lg xl:px-3 xl:pointer-coarse:h-12 ${FOCUS_RING} ${
                active
                  ? "font-semibold text-primary xl:bg-[color-mix(in_oklab,var(--primary)_13%,transparent)]"
                  : "font-medium text-muted hover:text-foreground xl:hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
              }`}
            >
              {active && (
                <span aria-hidden="true" className="absolute inset-y-2 left-0 hidden w-[3px] rounded-r-full bg-primary xl:block" />
              )}
              {/* En el riel la sección activa se marca con una píldora detrás del icono */}
              <span
                aria-hidden="true"
                className={`grid h-8 w-14 shrink-0 place-items-center rounded-full transition-colors xl:h-auto xl:w-auto xl:rounded-none xl:bg-transparent [&_svg]:size-5 ${
                  active ? ACTIVE_TINT : HOVER_TINT
                } xl:hover:bg-transparent`}
              >
                {icon}
              </span>
              <span className="max-w-full truncate text-[11px] leading-none tracking-tight xl:text-sm xl:tracking-normal">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mx-2 flex flex-col items-center gap-1 border-t border-[color-mix(in_oklab,var(--border)_70%,transparent)] py-3 xl:mx-3 xl:items-stretch">
        <div className="xl:hidden">
          <ThemeToggle variant="icon" />
        </div>
        <div className="hidden xl:block">
          <ThemeToggle variant="sidebar" />
        </div>
        <form action={logoutAction} className="w-full">
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className={`flex h-11 w-full items-center justify-center gap-3 rounded-lg px-3 text-sm text-muted transition-colors xl:h-10 xl:justify-start xl:pointer-coarse:h-12 ${HOVER_TINT} hover:text-foreground ${FOCUS_RING}`}
          >
            <span className="xl:hidden">{logoutIcon}</span>
            <span className="hidden xl:inline">Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
