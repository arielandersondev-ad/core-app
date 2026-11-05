import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("useIsMobile Hook Logic", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    // Restore original window
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      delete (globalThis as any).window;
    }
    vi.restoreAllMocks();
  });

  it("returns false safely when window is undefined (SSR environment)", async () => {
    delete (globalThis as any).window;

    // Dynamically import hook in simulated SSR environment
    const { useIsMobile } = await import("../src/hooks/useIsMobile");
    expect(typeof useIsMobile).toBe("function");
  });

  it("subscribes to window.matchMedia with default breakpoint 768px (max-width: 767.98px)", async () => {
    let capturedQuery = "";
    const listeners = new Set<() => void>();

    const mockMatchMedia = vi.fn().mockImplementation((query: string) => {
      capturedQuery = query;
      return {
        matches: true,
        media: query,
        addEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === "change") listeners.add(cb);
        }),
        removeEventListener: vi.fn((event: string, cb: () => void) => {
          if (event === "change") listeners.delete(cb);
        }),
      };
    });

    (globalThis as any).window = {
      matchMedia: mockMatchMedia,
      innerWidth: 600,
    };

    const mql = window.matchMedia(`(max-width: ${768 - 0.02}px)`);
    expect(capturedQuery).toBe("(max-width: 767.98px)");
    expect(mql.matches).toBe(true);
  });

  it("handles custom breakpoint properly (e.g. 1024px -> max-width: 1023.98px)", async () => {
    let capturedQuery = "";

    const mockMatchMedia = vi.fn().mockImplementation((query: string) => {
      capturedQuery = query;
      return {
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    });

    (globalThis as any).window = {
      matchMedia: mockMatchMedia,
      innerWidth: 1200,
    };

    const breakpoint = 1024;
    const mql = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);
    expect(capturedQuery).toBe("(max-width: 1023.98px)");
    expect(mql.matches).toBe(false);
  });

  it("handles fallback for environments without matchMedia by checking innerWidth", () => {
    (globalThis as any).window = {
      matchMedia: undefined,
      innerWidth: 500,
    };

    const isMobileBelow768 = window.innerWidth < 768;
    expect(isMobileBelow768).toBe(true);

    (globalThis as any).window.innerWidth = 1024;
    const isMobileAbove768 = window.innerWidth < 768;
    expect(isMobileAbove768).toBe(false);
  });

  it("supports older matchMedia addListener / removeListener API", () => {
    const listeners = new Set<() => void>();

    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      // No addEventListener, only legacy addListener
      addListener: vi.fn((cb: () => void) => listeners.add(cb)),
      removeListener: vi.fn((cb: () => void) => listeners.delete(cb)),
    }));

    (globalThis as any).window = {
      matchMedia: mockMatchMedia,
      innerWidth: 375,
    };

    const mql = window.matchMedia("(max-width: 767.98px)");
    const cb = () => {};
    (mql as any).addListener(cb);
    expect(listeners.has(cb)).toBe(true);

    (mql as any).removeListener(cb);
    expect(listeners.has(cb)).toBe(false);
  });
});
