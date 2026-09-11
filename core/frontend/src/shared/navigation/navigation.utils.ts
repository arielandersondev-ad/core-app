import type { NavigationItem } from "./navigation.types";

function normalizePathname(pathname: string): string {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

export function isNavigationItemActive( pathname: string, item: NavigationItem ): boolean {
  const currentPath = normalizePathname(pathname);
  const itemPaths = [item.href, ...(item.aliases ?? [])].map(normalizePathname);

  if (item.match === "exact") {
    return itemPaths.includes(currentPath);
  }

  return itemPaths.some(
    (itemPath) =>
      currentPath === itemPath || currentPath.startsWith(`${itemPath}/`),
  );
}

export function findActiveNavigationItem<T extends NavigationItem>( pathname: string, items: readonly T[] ): T | undefined {
  return [...items]
    .sort((first, second) => second.href.length - first.href.length)
    .find((item) => isNavigationItemActive(pathname, item));
}
