import type { NavigationItem } from "./navigation.types";

function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function isNavigationItemActive( pathname: string, item: NavigationItem ): boolean {
  const currentPath = normalizePathname(pathname);
  const itemPath = normalizePathname(item.href);

  if (item.match === "exact") {
    return currentPath === itemPath;
  }

  return (
    currentPath === itemPath ||
    currentPath.startsWith(`${itemPath}/`)
  );
}

export function findActiveNavigationItem<T extends NavigationItem>( pathname: string, items: readonly T[] ): T | undefined {
  return [...items]
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => isNavigationItemActive(pathname, item));
}