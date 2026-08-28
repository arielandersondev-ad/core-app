export type NavigationMatch = "exact" | "nested";

export type NavigationIcon =
  | "dashboard"
  | "organizations"
  | "users"
  | "roles";

export type NavigationItem = Readonly<{
  id: string;
  label: string;
  href: `/${string}`;
  icon: NavigationIcon;
  match: NavigationMatch;
}>;