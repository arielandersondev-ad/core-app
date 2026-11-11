/**
 * Temas de la aplicación (Core y Dentistry).
 *
 * Módulo sin React ni APIs de servidor, por eso se puede importar desde el
 * layout raíz (Server Component) vía `@app/ui/theme`.
 *
 * Clases que se aplican sobre <html>:
 *   light      → (ninguna)
 *   dark       → .dark
 *   winter     → .dark .winter             (Invernal: oscuro con paleta propia)
 *   christmas  → .dark .winter .christmas  (Navideño: Invernal + luces y nieve)
 *   system     → .dark solo si el sistema operativo prefiere oscuro
 *
 * Cada tema hereda el anterior, así las utilidades `dark:` y la paleta
 * Invernal siguen aplicando. Los tokens viven en `src/styles/tokens.css` y la
 * decoración navideña en `src/styles/christmas.css`.
 *
 * `.effects-paused` (preferencia separada) detiene las animaciones decorativas.
 */

export type ThemePreference = "light" | "dark" | "winter" | "christmas" | "system";

export const THEME_STORAGE_KEY = "theme";
export const THEME_EFFECTS_STORAGE_KEY = "theme-effects";

/** Orden en que se ofrecen y rotan los temas. */
export const THEME_OPTIONS: readonly ThemePreference[] = [
  "light",
  "dark",
  "winter",
  "christmas",
  "system",
];

export const THEME_LABELS: Record<ThemePreference, string> = {
  light: "Claro",
  dark: "Oscuro",
  winter: "Invernal",
  christmas: "Navideño",
  system: "Sistema",
};

export const THEME_DESCRIPTIONS: Record<ThemePreference, string> = {
  light: "Interfaz clara",
  dark: "Interfaz oscura",
  winter: "Oscuro con tonos índigo y ciruela",
  christmas: "Invernal con luces y nieve",
  system: "Sigue la configuración del dispositivo",
};

export const THEME_CHANGE_EVENT = "app-theme-change";

export interface ThemeClasses {
  dark: boolean;
  winter: boolean;
  christmas: boolean;
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && (THEME_OPTIONS as readonly string[]).includes(value);
}

/** Indica si el tema tiene decoración animada (y por tanto control de pausa). */
export function themeHasEffects(preference: ThemePreference): boolean {
  return preference === "christmas";
}

/** Clases que debe llevar <html> para una preferencia dada. */
export function resolveThemeClasses(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ThemeClasses {
  switch (preference) {
    case "light":
      return { dark: false, winter: false, christmas: false };
    case "dark":
      return { dark: true, winter: false, christmas: false };
    case "winter":
      return { dark: true, winter: true, christmas: false };
    case "christmas":
      return { dark: true, winter: true, christmas: true };
    default:
      return { dark: systemPrefersDark, winter: false, christmas: false };
  }
}

export function nextThemePreference(current: ThemePreference): ThemePreference {
  return THEME_OPTIONS[(THEME_OPTIONS.indexOf(current) + 1) % THEME_OPTIONS.length];
}

/**
 * Script inline para <head>: aplica el tema antes del primer pintado y evita
 * el parpadeo. Debe reflejar `resolveThemeClasses`.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");var c=document.documentElement.classList;var x=t==="christmas";var w=t==="winter"||x;var d=t==="dark"||w||((!t||t==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);c.toggle("dark",d);c.toggle("winter",w);c.toggle("christmas",x);c.toggle("effects-paused",localStorage.getItem("${THEME_EFFECTS_STORAGE_KEY}")==="paused");}catch(e){}})();`;
