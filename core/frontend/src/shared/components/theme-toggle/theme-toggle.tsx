'use client';

import type { ReactNode } from "react";
import {
  Icons,
  THEME_LABELS,
  nextThemePreference,
  themeHasEffects,
  useThemeEffects,
  useThemePreference,
  type ThemePreference,
} from "@/shared/components/ui";

type ThemeToggleProps = {
  variant?: "panel" | "icon";
};

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-[18px]"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.42 1.42" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.35 17.65-1.42 1.42" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-[18px]"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

const THEME_ICONS: Record<ThemePreference, ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  winter: <span aria-hidden="true">{Icons.snowflake}</span>,
  christmas: <span aria-hidden="true">{Icons.tree}</span>,
  system: <span aria-hidden="true">{Icons.monitor}</span>,
};

const FOCUS_RING = [
  "focus-visible:outline-none focus-visible:ring-2",
  "focus-visible:ring-primary focus-visible:ring-offset-2",
  "focus-visible:ring-offset-surface",
].join(" ");

function EffectsPauseButton() {
  const { paused, togglePaused } = useThemeEffects();
  const label = "Pausar efectos del tema";

  return (
    <button
      type="button"
      onClick={togglePaused}
      aria-label={label}
      aria-pressed={paused}
      title={label}
      className={`inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background/70 text-muted transition-colors hover:bg-surface-elevated hover:text-foreground ${FOCUS_RING}`}
    >
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        {paused ? (
          <path d="M8 5v14l11-7z" />
        ) : (
          <>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </>
        )}
      </svg>
    </button>
  );
}

/**
 * Rota entre Claro → Oscuro → Invernal → Navideño → Sistema.
 * Muestra el tema activo; la etiqueta accesible anuncia el siguiente.
 * En temas con animación (Navideño), la variante panel ofrece pausarla.
 */
export function ThemeToggle({
  variant = "panel",
}: ThemeToggleProps) {
  const { preference, cyclePreference } = useThemePreference();
  const current = THEME_LABELS[preference];
  const accessibleLabel = `Tema ${current}. Cambiar a ${THEME_LABELS[nextThemePreference(preference)]}`;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={cyclePreference}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={[
          "inline-flex size-10 items-center justify-center rounded-lg",
          "border border-border bg-surface-elevated text-muted",
          "transition-colors hover:text-foreground",
          FOCUS_RING,
        ].join(" ")}
      >
        {THEME_ICONS[preference]}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={cyclePreference}
      aria-label={accessibleLabel}
      className={[
        "group flex min-w-0 flex-1 items-center gap-3 rounded-lg border",
        "border-border bg-background/70 px-3 py-2.5 text-left",
        "transition-colors hover:bg-surface-elevated",
        FOCUS_RING,
      ].join(" ")}
    >
      <span className="text-muted transition-colors group-hover:text-foreground">
        {THEME_ICONS[preference]}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">
          Apariencia
        </span>

        <span className="block text-[11px] text-muted">
          Tema {current}
        </span>
      </span>
    </button>
    {themeHasEffects(preference) && <EffectsPauseButton />}
    </div>
  );
}
