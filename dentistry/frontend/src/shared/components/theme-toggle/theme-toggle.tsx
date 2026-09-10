"use client";

import { useEffect, useState } from "react";
import { Icons } from "../icons/icons";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";

const OPTIONS: readonly ThemePreference[] = ["light", "dark", "system"];

const LABELS: Record<ThemePreference, string> = {
  light: "Claro",
  dark: "Oscuro",
  system: "Sistema",
};

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

type ThemeToggleProps = {
  variant?: "pill" | "sidebar" | "icon";
};

export function ThemeToggle({ variant = "pill" }: ThemeToggleProps) {
  const [preference, setPreference] = useState<ThemePreference>("system");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    const initial =
      stored && OPTIONS.includes(stored) ? stored : "system";
    setPreference(initial);
    applyTheme(initial);
  }, []);

  function cycleTheme() {
    const next = OPTIONS[(OPTIONS.indexOf(preference) + 1) % OPTIONS.length];
    if (next === "system") {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, next);
    }
    applyTheme(next);
    setPreference(next);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label="Cambiar tema"
        className="p-2 text-muted transition-colors hover:text-foreground"
      >
        {preference === "dark" ? Icons.sun : Icons.moon}
      </button>
    );
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        aria-label="Cambiar tema"
        className="flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-sm text-muted transition-colors hover:bg-background hover:text-foreground w-full"
      >
        <span>{preference === "dark" ? Icons.sun : Icons.moon}</span>
        Tema {LABELS[preference]}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label="Cambiar tema"
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
    >
      Tema: {LABELS[preference]}
    </button>
  );
}
