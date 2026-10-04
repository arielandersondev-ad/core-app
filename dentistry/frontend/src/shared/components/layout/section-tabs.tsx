"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTION_TABS, type AppSection } from "./navigation";

export function SectionTabs({ section }: { section: AppSection }) {
  const pathname = usePathname();
  const tabs = SECTION_TABS[section];
  if (!tabs) return null;

  return (
    <div className="flex items-center gap-1 border-b border-border px-8">
      {tabs.map(({ label, href: tabHref, exact }) => {
        const active = exact ? pathname === tabHref : pathname.startsWith(tabHref);

        return (
          <Link
            key={tabHref}
            href={tabHref}
            className={`px-3 py-2.5 text-sm font-display font-medium -mb-px border-b-2 transition-colors ${
              active
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
