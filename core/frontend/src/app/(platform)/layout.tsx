import type { ReactNode } from "react";
import { navigationItems } from "@/config/navigation";
import { AppShell } from "@/shared/components/layout/app-shell";
import { QueryProvider } from '@/infrastructure/query/query-provider';

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AppShell navigationItems={navigationItems}>{children}</AppShell>
    </QueryProvider>
  );
}
