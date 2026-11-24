"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SECTION_TITLES, isNavItemActive } from "./navigation";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout-action";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import { organizationDisplayName } from "@/shared/session/display-names";

function getSectionTitle(pathname: string): string {
  const item = [...NAV_ITEMS].reverse().find(({ href }) => isNavItemActive(pathname, href));
  return item ? SECTION_TITLES[item.section] : "Dashboard";
}

/** Barra superior translúcida que flota sobre `main`; degradado de abajo (más denso) hacia arriba. */
export function AppNavbar() {
  const pathname = usePathname();
  const title = getSectionTitle(pathname);
  const organizationName = organizationDisplayName(useAuthenticatedSession());

  return (
    <header className="absolute inset-x-0 top-0 z-30 flex h-[var(--shell-top)] items-center gap-2 bg-linear-to-t from-background/92 to-background/55 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 md:px-6 xl:px-8">
      {/* Mobile: logo */}
      <Link
        href="/dashboard"
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:hidden"
        title={organizationName}
      >
        <BrandMark className="size-8 rounded-[10px]" />
        <span className="min-w-0 truncate font-display text-[15px] font-semibold text-foreground">
          {organizationName}
        </span>
      </Link>

      {/* Tablet y escritorio: título; con el riel (768–1279 px) también la organización */}
      <div className="hidden min-w-0 flex-1 flex-col md:flex">
        <span className="truncate text-xs font-medium text-muted xl:hidden">{organizationName}</span>
        <h1 className="truncate font-display text-lg font-semibold leading-tight text-foreground">{title}</h1>
      </div>

      <ThemeToggle variant="icon" />
      <form action={logoutAction} className="md:hidden">
        <button
          type="submit"
          className="h-10 rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          Salir
        </button>
      </form>
    </header>
  );
}
