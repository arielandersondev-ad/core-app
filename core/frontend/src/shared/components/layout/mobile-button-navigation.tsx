"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationIcon } from "@/shared/components/icons/navigation-icon";
import type { NavigationItem } from "@/shared/navigation/navigation.types";
import { isNavigationItemActive } from "@/shared/navigation/navigation.utils";

type MobileBottomNavigationProps = { items: readonly NavigationItem[] };

export function MobileBottomNavigation({ items }: MobileBottomNavigationProps) {
  const pathname = usePathname();

  const mobileItems = items.filter(
    (item) => item.mobileLabel !== undefined,
  );

  return (
    <nav
      aria-label="Navegación móvil"
      className={[
        "z-30 shrink-0 border-t border-border",
        "bg-surface/95 backdrop-blur lg:hidden",
      ].join(" ")}
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)",
      }}
    >
      <ul
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${mobileItems.length}, minmax(0, 1fr))`,
        }}
      >
        {mobileItems.map((item) => {
          const isActive = isNavigationItemActive(pathname, item);

          return (
            <li key={item.id} className="min-w-0">
              <Link
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group relative flex min-h-16 min-w-0",
                  "flex-col items-center justify-center gap-1 px-1 pt-2",
                  "transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-inset focus-visible:ring-primary",
                  isActive
                    ? "text-primary"
                    : "text-muted hover:text-foreground",
                ].join(" ")}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute left-1/2 top-0 h-0.5 w-8",
                      "-translate-x-1/2 rounded-b-full bg-primary",
                    ].join(" ")}
                  />
                )}

                <NavigationIcon
                  name={item.icon}
                  className={[
                    "size-5 shrink-0 transition-transform",
                    isActive ? "scale-105" : "group-hover:scale-105",
                  ].join(" ")}
                />

                <span
                  className={[
                    "max-w-full truncate text-[9px]",
                    "uppercase tracking-[0.12em]",
                    isActive ? "font-semibold" : "font-medium",
                  ].join(" ")}
                >
                  {item.mobileLabel}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}