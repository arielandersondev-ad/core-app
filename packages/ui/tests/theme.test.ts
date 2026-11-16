import { describe, it, expect } from "vitest";
import {
  THEME_INIT_SCRIPT,
  THEME_LABELS,
  THEME_OPTIONS,
  isThemePreference,
  nextThemePreference,
  resolveThemeClasses,
  themeHasEffects,
} from "../src/theme/theme";

const none = { dark: false, winter: false, christmas: false, sky: false };

describe("resolveThemeClasses", () => {
  it.each([
    ["light", false, none],
    ["light", true, none],
    ["sky", true, { ...none, sky: true }],
    ["dark", false, { ...none, dark: true }],
    ["winter", false, { ...none, dark: true, winter: true }],
    ["christmas-light", true, { ...none, christmas: true }],
    ["christmas", false, { ...none, dark: true, winter: true, christmas: true }],
    ["system", false, none],
    ["system", true, { ...none, dark: true }],
  ] as const)("%s (system dark: %s)", (preference, systemDark, expected) => {
    expect(resolveThemeClasses(preference, systemDark)).toEqual(expected);
  });
});

describe("theme options", () => {
  it("rotates light → sky → dark → winter → christmas-light → christmas → system → light", () => {
    expect(nextThemePreference("light")).toBe("sky");
    expect(nextThemePreference("sky")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("winter");
    expect(nextThemePreference("winter")).toBe("christmas-light");
    expect(nextThemePreference("christmas-light")).toBe("christmas");
    expect(nextThemePreference("christmas")).toBe("system");
    expect(nextThemePreference("system")).toBe("light");
  });

  it("labels every option", () => {
    for (const option of THEME_OPTIONS) expect(THEME_LABELS[option]).toBeTruthy();
    expect(THEME_LABELS.winter).toBe("Invernal");
    expect(THEME_LABELS.christmas).toBe("Navideño");
    expect(THEME_LABELS["christmas-light"]).toBe("Navideño claro");
    expect(THEME_LABELS.sky).toBe("Celeste");
  });

  it("only the christmas themes have animated effects", () => {
    expect(THEME_OPTIONS.filter(themeHasEffects)).toEqual(["christmas-light", "christmas"]);
  });

  it("validates stored values", () => {
    expect(isThemePreference("winter")).toBe(true);
    expect(isThemePreference("christmas-light")).toBe(true);
    expect(isThemePreference("sepia")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe("THEME_INIT_SCRIPT", () => {
  function run(stored: string | null, systemDark: boolean, effects: string | null = null) {
    const classes = new Set<string>();
    const classList = {
      toggle: (name: string, force: boolean) => (force ? classes.add(name) : classes.delete(name)),
    };
    const fn = new Function("localStorage", "document", "window", THEME_INIT_SCRIPT);
    fn(
      { getItem: (key: string) => (key === "theme" ? stored : effects) },
      { documentElement: { classList } },
      { matchMedia: () => ({ matches: systemDark }) },
    );
    return {
      dark: classes.has("dark"),
      winter: classes.has("winter"),
      christmas: classes.has("christmas"),
      sky: classes.has("sky"),
      paused: classes.has("effects-paused"),
    };
  }

  it("matches resolveThemeClasses for every stored value", () => {
    for (const stored of [null, ...THEME_OPTIONS]) {
      for (const systemDark of [false, true]) {
        const preference = stored ?? "system";
        expect(run(stored, systemDark)).toEqual({
          ...resolveThemeClasses(preference as "light", systemDark),
          paused: false,
        });
      }
    }
  });

  it("restores paused effects before first paint", () => {
    expect(run("christmas", false, "paused").paused).toBe(true);
  });
});
