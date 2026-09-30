"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { Icons } from "../icons/icons";
import { logoutAction } from "@/features/auth/actions/logout-action";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 flex flex-col border-r border-border bg-surface">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-border gap-2.5">
        <div className="w-7 h-7 bg-primary rounded-[3px] flex items-center justify-center flex-shrink-0">
          {Icons.tooth}
        </div>
        <span className="font-display text-sm font-bold tracking-wide text-foreground">
          Dental<span className="text-primary">tery</span>
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ section, label, href, icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={section}
              href={href}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] text-left transition-colors text-sm font-display font-medium ${
                active
                  ? "bg-primary-subtle text-primary"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              <span className={active ? "text-primary" : "text-muted"}>
                {icon}
              </span>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-3 flex flex-col gap-1">
        <ThemeToggle variant="sidebar" />
        <form action={logoutAction}>
          <button type="submit" className="w-full text-left px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-background rounded-[3px]">Cerrar sesión</button>
        </form>
      </div>
    </aside>
  );
}
