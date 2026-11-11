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

describe("resolveThemeClasses", () => {
  it.each([
    ["light", false, { dark: false, winter: false, christmas: false }],
    ["light", true, { dark: false, winter: false, christmas: false }],
    ["dark", false, { dark: true, winter: false, christmas: false }],
    ["winter", false, { dark: true, winter: true, christmas: false }],
    ["christmas", false, { dark: true, winter: true, christmas: true }],
    ["system", false, { dark: false, winter: false, christmas: false }],
    ["system", true, { dark: true, winter: false, christmas: false }],
  ] as const)("%s (system dark: %s)", (preference, systemDark, expected) => {
    expect(resolveThemeClasses(preference, systemDark)).toEqual(expected);
  });
});

describe("theme options", () => {
  it("rotates light → dark → winter → christmas → system → light", () => {
    expect(nextThemePreference("light")).toBe("dark");
    expect(nextThemePreference("dark")).toBe("winter");
    expect(nextThemePreference("winter")).toBe("christmas");
    expect(nextThemePreference("christmas")).toBe("system");
    expect(nextThemePreference("system")).toBe("light");
  });

  it("labels every option, winter as Invernal", () => {
    for (const option of THEME_OPTIONS) expect(THEME_LABELS[option]).toBeTruthy();
    expect(THEME_LABELS.winter).toBe("Invernal");
    expect(THEME_LABELS.christmas).toBe("Navideño");
  });

  it("only christmas has animated effects", () => {
    expect(THEME_OPTIONS.filter(themeHasEffects)).toEqual(["christmas"]);
  });

  it("validates stored values", () => {
    expect(isThemePreference("winter")).toBe(true);
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
      paused: classes.has("effects-paused"),
    };
  }

  it("matches resolveThemeClasses for every stored value", () => {
    for (const stored of [null, "light", "dark", "winter", "christmas", "system"]) {
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
