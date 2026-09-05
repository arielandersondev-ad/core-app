"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";
import type { NavigationItem } from "@/shared/navigation/navigation.types";
import { findActiveNavigationItem } from "@/shared/navigation/navigation.utils";

type AppNavbarProps = {
  items: readonly NavigationItem[];
};

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function AppNavbar({ items }: AppNavbarProps) {
  const pathname = usePathname();
  const activeItem = findActiveNavigationItem(pathname, items);
  const title = activeItem?.label ?? "Core";

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 flex-1 items-center">
        <Link
          href="/dashboard"
          aria-label="Ir al resumen"
          className={[
            "flex items-center gap-3 rounded-md lg:hidden",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="size-2 rounded-[2px] bg-primary"
          />

          <span className="flex flex-col">
            <span className="text-sm font-bold tracking-[0.08em] text-primary">
              CORE
            </span>

            <span className="text-[9px] uppercase tracking-[0.14em] text-muted">
              Platform System
            </span>
          </span>
        </Link>

        <nav
          aria-label="Ruta actual"
          className="hidden min-w-0 items-center gap-2 lg:flex"
        >
          <Link
            href="/dashboard"
            className={[
              "rounded-sm text-sm text-muted transition-colors",
              "hover:text-foreground",
              "focus-visible:outline-none focus-visible:ring-2",
              "focus-visible:ring-primary",
            ].join(" ")}
          >
            Core
          </Link>

          <span aria-hidden="true" className="text-muted">
            <ChevronRightIcon />
          </span>

          <h1 className="truncate text-sm font-semibold text-foreground">
            {title}
          </h1>
        </nav>
      </div>

      <div className="ml-4 flex shrink-0 items-center">
        <div className="lg:hidden">
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </header>
  );
}