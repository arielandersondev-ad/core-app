"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navigation";

export function BottomNav() {
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => item.showInBottomNav !== false);

  return (
    <div className="flex-shrink-0 border-t border-border bg-surface lg:hidden">
      <div className="flex">
        {visibleItems.map(({ section, label, href, icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={section}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
            >
              <span
                className={`transition-colors ${active ? "text-primary" : "text-muted"}`}
              >
                {icon}
              </span>
              <span
                className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${active ? "text-primary font-semibold" : "text-muted"}`}
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
      <div className="flex justify-center pb-2 pt-1">
        <div className="w-28 h-1 bg-muted/30 rounded-full" />
      </div>
    </div>
  );
}
