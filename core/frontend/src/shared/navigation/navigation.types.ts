export type NavigationMatch = "exact" | "nested";

export type NavigationIcon =
  | "dashboard"
  | "organizations"
  | "users"
  | "roles"
  | "settings";

export type NavigationItem = Readonly<{
  id: string;
  label: string;
  mobileLabel: string;
  href: `/${string}`;
  aliases?: readonly `/${string}`[];
  icon: NavigationIcon;
  match: NavigationMatch;
}>;
