"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationIcon } from "@/shared/components/icons/navigation-icon";
import type { NavigationItem } from "@/shared/navigation/navigation.types";
import { isNavigationItemActive } from "@/shared/navigation/navigation.utils";

type NavigationListProps = {
  items: readonly NavigationItem[];
  ariaLabel?: string;
  onNavigate?: () => void;
};

export function NavigationList({
  items,
  ariaLabel = "Navegación principal",
  onNavigate,
}: NavigationListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => {
          const isActive = isNavigationItemActive(pathname, item);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "group flex min-h-11 items-center gap-3 rounded-lg",
                  "px-3.5 py-2 text-[13px] font-medium",
                  "transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-primary focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-surface",
                  isActive
                    ? [
                        "bg-gradient-to-r from-[#176b35] to-[#338746]",
                        "text-white shadow-[0_8px_24px_rgba(23,107,53,0.2)]",
                        "ring-1 ring-white/10",
                      ].join(" ")
                    : [
                        "text-muted hover:bg-background",
                        "hover:text-foreground",
                      ].join(" "),
                ].join(" ")}
              >
                <NavigationIcon
                  name={item.icon}
                  className={[
                    "size-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-muted group-hover:text-foreground",
                  ].join(" ")}
                />

                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}