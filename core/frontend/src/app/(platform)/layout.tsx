import type { ReactNode } from "react";
import { navigationItems } from "@/config/navigation";
import { AppShell } from "@/shared/components/layout/app-shell";

export default function PlatformLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell navigationItems={navigationItems}>
      {children}
    </AppShell>
  );
}
