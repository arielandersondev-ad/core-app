'use client';

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeToggleProps = {
  variant?: "panel" | "icon";
};

const STORAGE_KEY = "theme";

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

export function ThemeToggle({
  variant = "panel",
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const currentTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

    setTheme(currentTheme);
  }, []);
>>>>>>> c3c802cb2ac0139e966d33b6daf8df495ef62fb7

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    document.documentElement.classList.toggle(
      "dark",
      nextTheme === "dark",
    );

    localStorage.setItem(STORAGE_KEY, nextTheme);
    setTheme(nextTheme);
  }

  const isDark = theme === "dark";

  const accessibleLabel =
    theme === null
      ? "Cambiar tema"
      : isDark
        ? "Activar modo claro"
        : "Activar modo oscuro";

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={accessibleLabel}
        aria-pressed={isDark}
        title={accessibleLabel}
        className={[
          "inline-flex size-10 items-center justify-center rounded-lg",
          "border border-border bg-surface-elevated text-muted",
          "transition-colors hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-primary focus-visible:ring-offset-2",
          "focus-visible:ring-offset-surface",
        ].join(" ")}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={accessibleLabel}
      aria-pressed={isDark}
      className={[
        "group flex w-full items-center gap-3 rounded-lg border",
        "border-border bg-background/70 px-3 py-2.5 text-left",
        "transition-colors hover:bg-surface-elevated",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-primary focus-visible:ring-offset-2",
        "focus-visible:ring-offset-surface",
      ].join(" ")}
    >
      <span className="text-muted transition-colors group-hover:text-foreground">
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-medium text-foreground">
          Apariencia
        </span>

        <span className="block text-[11px] text-muted">
          {theme === null
            ? "Detectando tema"
            : isDark
              ? "Modo oscuro"
              : "Modo claro"}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={[
          "relative h-5 w-9 shrink-0 rounded-full border border-border",
          "transition-colors",
          isDark ? "bg-primary" : "bg-surface-elevated",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 size-4 rounded-full shadow-sm",
            "transition-transform",
            isDark
              ? "translate-x-4 bg-primary-foreground"
              : "translate-x-0.5 bg-muted",
          ].join(" ")}
        />
      </span>
    </button>
  );
}