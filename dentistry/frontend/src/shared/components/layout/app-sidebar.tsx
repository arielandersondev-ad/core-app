"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";
import { ThemeToggle } from "../theme-toggle/theme-toggle";
import { Icons } from "../icons/icons";

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

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-[3px]">
          <div className="w-7 h-7 rounded-[2px] bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-display font-bold flex-shrink-0">
            DA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-foreground truncate">
              Dr. Admin
            </p>
            <p className="text-[10px] font-mono text-muted truncate">
              Administrador
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
