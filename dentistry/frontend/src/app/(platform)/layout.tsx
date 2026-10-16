import type { ReactNode } from "react";
import { AppShell } from "@/shared/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/infrastructure/auth/server-session";
import { getCurrentSession } from "@/infrastructure/auth/current-session";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/login");
  const session = await getCurrentSession(token);
  if (session === null) redirect("/login");
  return <AppShell>{children}</AppShell>;
}
