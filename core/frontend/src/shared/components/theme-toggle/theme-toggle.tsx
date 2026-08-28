'use client';

import { useEffect, useState } from "react";

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

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';
    const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
    return stored && OPTIONS.includes(stored) ? stored : 'system';
  });

  // Solo al montar: aplicar el tema inicial
  useEffect(() => {
    applyTheme(preference);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Deshabilita la regla porque es intencional

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