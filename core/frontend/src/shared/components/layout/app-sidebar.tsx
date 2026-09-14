import Link from "next/link";
import { NavigationList } from "./navigation-list";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";
import { CrowAntBrand } from "@/shared/components/brand/CrowAntBrand";
import type { NavigationItem } from "@/shared/navigation/navigation.types";

type AppSidebarProps = {
  items: readonly NavigationItem[];
};

export function AppSidebar({ items }: AppSidebarProps) {
  return (
    <aside
      aria-label="Barra lateral"
      className={[
        "relative flex h-full w-60 flex-col overflow-hidden",
        "border-r border-border bg-surface",
      ].join(" ")}
    >
      <div
        aria-hidden="true"
        className={[
          "pointer-events-none absolute right-0 top-20 h-40 w-px",
          "bg-gradient-to-b from-transparent via-primary/60 to-transparent",
        ].join(" ")}
      />

      <div className="flex h-20 shrink-0 items-center px-5">
        <Link
          href="/dashboard"
          aria-label="Ir al resumen"
          className={[
            "flex items-center gap-3 rounded-md",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary",
          ].join(" ")}
        >
          <CrowAntBrand />
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          CrowAnt Core
        </p>

        <NavigationList
          items={items}
          ariaLabel="Navegación de la plataforma"
        />
      </div>

      <div className="shrink-0 border-t border-border p-3">
        <ThemeToggle />
      </div>
    </aside>
  );
}
