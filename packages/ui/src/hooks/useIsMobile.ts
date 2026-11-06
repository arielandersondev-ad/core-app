"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook to detect if the current viewport is mobile (width < breakpoint).
 * Default breakpoint: 768px (Tailwind 'md').
 * Safe for SSR (defaults to false on server).
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) {
        return () => {};
      }

      // Query for viewport strictly below breakpoint (e.g. max-width: 767.98px for 768)
      const mql = window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`);

      const onChange = () => callback();

      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [breakpoint]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    if (window.matchMedia) {
      return window.matchMedia(`(max-width: ${breakpoint - 0.02}px)`).matches;
    }
    return window.innerWidth < breakpoint;
  }, [breakpoint]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
