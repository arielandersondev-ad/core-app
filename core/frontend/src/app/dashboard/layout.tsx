import { navigationItems } from "@/config/navigation";
import { AppShell } from "@/shared/components/layout/app-shell";

export default function DashboardPage({children}: LayoutProps<"/dashboard">) {
  return (
    <AppShell
      navigationItems={navigationItems}
    >
      {children}
    </AppShell>
  )
}