import type { ReactNode } from "react";
import { AppShell } from "@/shared/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getAccessToken } from "@/infrastructure/auth/server-session";
import { getCurrentSession } from "@/infrastructure/auth/current-session";
import { QueryProvider } from "@/infrastructure/query/query-provider";
import { AuthenticatedSessionProvider } from "@/infrastructure/auth/authenticated-session";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  const token = await getAccessToken();
  if (!token) redirect("/login");
  const session = await getCurrentSession(token);
  if (session === null) redirect("/login");
  const sessionScope = `${session.user.id}:${session.context.organizationId}:${session.context.membershipId}`;
  return (
    <AuthenticatedSessionProvider session={session}>
      <QueryProvider key={sessionScope}><AppShell>{children}</AppShell></QueryProvider>
    </AuthenticatedSessionProvider>
  );
}
