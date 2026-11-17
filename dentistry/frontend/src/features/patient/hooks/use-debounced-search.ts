"use client";

import { useEffect, useState } from "react";

export function useDebouncedSearch(search: string): string {
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  return debounced;
}
