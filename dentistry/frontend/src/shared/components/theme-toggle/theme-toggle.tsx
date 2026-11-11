"use client";

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

const THEME_ICONS: Record<ThemePreference, ReactNode> = {
  light: Icons.sun,
  dark: Icons.moon,
  winter: Icons.snowflake,
  christmas: Icons.tree,
  system: Icons.monitor,
};

const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

type ThemeToggleProps = {
  variant?: "pill" | "sidebar" | "icon";
};

/**
 * Rota entre Claro → Oscuro → Invernal → Navideño → Sistema.
 * El icono y el texto muestran el tema activo; la etiqueta accesible anuncia el siguiente.
 * En temas con animación (Navideño), las variantes con texto ofrecen pausarla.
 */
export function ThemeToggle({ variant = "pill" }: ThemeToggleProps) {
  const { preference, cyclePreference } = useThemePreference();
  const current = THEME_LABELS[preference];
  const next = THEME_LABELS[nextThemePreference(preference)];
  const accessibleLabel = `Tema ${current}. Cambiar a ${next}`;
  const icon = <span aria-hidden="true">{THEME_ICONS[preference]}</span>;
  const showEffects = themeHasEffects(preference);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={cyclePreference}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={`rounded-lg p-2 text-muted transition-colors hover:text-foreground ${FOCUS_RING}`}
      >
        {icon}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={cyclePreference}
          aria-label={accessibleLabel}
          className={`flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-background hover:text-foreground ${FOCUS_RING}`}
        >
          {icon}
          <span className="truncate">Tema {current}</span>
        </button>
        {showEffects && <EffectsPauseButton />}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={cyclePreference}
        aria-label={accessibleLabel}
        className={`inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated ${FOCUS_RING}`}
      >
        {icon}
        Tema: {current}
      </button>
      {showEffects && <EffectsPauseButton />}
    </span>
  );
}

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
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-background hover:text-foreground ${FOCUS_RING}`}
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
