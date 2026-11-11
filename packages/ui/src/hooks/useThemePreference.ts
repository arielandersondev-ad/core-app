"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  THEME_CHANGE_EVENT,
  THEME_EFFECTS_STORAGE_KEY,
  THEME_STORAGE_KEY,
  isThemePreference,
  nextThemePreference,
  resolveThemeClasses,
  type ThemePreference,
} from "../theme/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function readEffectsPaused(): boolean {
  try {
    return window.localStorage.getItem(THEME_EFFECTS_STORAGE_KEY) === "paused";
  } catch {
    return false;
  }
}

function applyPreference(preference: ThemePreference) {
  const { dark, winter, christmas } = resolveThemeClasses(
    preference,
    window.matchMedia(DARK_QUERY).matches,
  );
  const classes = document.documentElement.classList;
  classes.toggle("dark", dark);
  classes.toggle("winter", winter);
  classes.toggle("christmas", christmas);
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento disponible: la preferencia no puede persistirse.
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function notify() {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function getServerPreference(): ThemePreference {
  return "system";
}

function getServerEffectsPaused(): boolean {
  return false;
}

/**
 * Preferencia de tema compartida entre todos los selectores montados
 * (sidebar, navbar, ajustes) y sincronizada entre pestañas.
 */
export function useThemePreference() {
  const preference = useSyncExternalStore(subscribe, readPreference, getServerPreference);

  // Reaplica al cambiar de preferencia y, en "system", sigue al sistema operativo.
  useEffect(() => {
    applyPreference(preference);
    if (preference !== "system") return;
    const media = window.matchMedia(DARK_QUERY);
    const onSystemChange = () => applyPreference("system");
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    writeStorage(THEME_STORAGE_KEY, next === "system" ? null : next);
    applyPreference(next);
    notify();
  }, []);

  const cyclePreference = useCallback(() => {
    setPreference(nextThemePreference(readPreference()));
  }, [setPreference]);

  return { preference, setPreference, cyclePreference };
}

/**
 * Pausa de las animaciones decorativas de un tema (luces y nieve del Navideño).
 * Es independiente del tema: se recuerda aunque el usuario cambie y vuelva.
 */
export function useThemeEffects() {
  const paused = useSyncExternalStore(subscribe, readEffectsPaused, getServerEffectsPaused);

  useEffect(() => {
    document.documentElement.classList.toggle("effects-paused", paused);
  }, [paused]);

  const togglePaused = useCallback(() => {
    const next = !readEffectsPaused();
    writeStorage(THEME_EFFECTS_STORAGE_KEY, next ? "paused" : null);
    document.documentElement.classList.toggle("effects-paused", next);
    notify();
  }, []);

  return { paused, togglePaused };
}
