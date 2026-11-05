"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";

export function BottomNav() {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.showInBottomNav !== false);

  return (
    <nav
      aria-label="Navegación móvil"
      className="flex-shrink-0 border-t border-border bg-surface lg:hidden relative z-30"
    >
      <div className="flex items-center justify-around px-2 py-1 relative">
        {visibleItems.map(({ section, label, href, icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          const isAgenda = section === "agenda";

          if (isAgenda) {
            return (
              <div
                key={section}
                className="flex-1 flex flex-col items-center justify-center relative -top-3"
              >
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg border-2 border-surface transition-all duration-200 active:scale-95 ${
                    active
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-105"
                      : "bg-primary text-primary-foreground hover:opacity-95"
                  }`}
                  aria-label="Agenda de citas"
                >
                  <span className="text-xl shrink-0 leading-none">
                    {icon}
                  </span>
                  <span className="text-[8px] font-mono uppercase font-bold tracking-tight leading-none mt-0.5">
                    {label}
                  </span>
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={section}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-1 relative"
            >
              <span
                className={`transition-colors ${active ? "text-primary" : "text-muted"}`}
              >
                {icon}
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                  active ? "text-primary font-semibold" : "text-muted"
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b" />
              )}
            </Link>
          );
        })}
      </div>
      <div className="flex justify-center pb-2 pt-0.5">
        <div className="w-28 h-1 bg-muted/30 rounded-full" />
      </div>
    </nav>
  );
}
