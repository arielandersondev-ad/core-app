"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, SECTION_TITLES } from "./navigation";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { Icons } from "../icons/icons";

function getSectionTitle(pathname: string): string {
  const item = [...NAV_ITEMS]
    .reverse()
    .find(({ href }) =>
      href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(href),
    );
  return item ? SECTION_TITLES[item.section] : "Dashboard";
}

export function AppNavbar() {
  const pathname = usePathname();
  const title = getSectionTitle(pathname);

  return (
    <header className="h-14 flex items-center px-4 lg:px-6 border-b border-border bg-surface gap-3 flex-shrink-0">
      {/* Mobile: logo */}
      <div className="lg:hidden flex items-center gap-2 flex-1">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="font-display text-[13px] font-bold tracking-wide text-foreground">
            Dental<span className="text-primary">tery</span>
          </span>
        </Link>
      </div>

      {/* Desktop: title */}
      <div className="hidden lg:flex items-center flex-1 min-w-0">
        <h1 className="font-display font-semibold text-foreground text-base">
          {title}
        </h1>
      </div>

      {/* Mobile: title (when navigated deep - placeholder for future) */}
      <div className="lg:hidden flex-1" />

      {/* Theme toggle icon */}
      <ThemeToggle variant="icon" />
    </header>
  );
}
