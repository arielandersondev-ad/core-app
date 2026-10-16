export function safeReturnTo(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) {
    return "/dashboard";
  }
  const path = value.split(/[?#]/, 1)[0];
  if (path === "/login" || path.startsWith("/api/")) return "/dashboard";
  return value;
}
