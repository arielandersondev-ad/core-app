import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import type { NavigationItem } from "@/shared/navigation/navigation.types";
import { AppNavbar } from "./app-navbar";
import { MobileBottomNavigation } from "./mobile-button-navigation";

type AppShellProps = {
  children: ReactNode;
  navigationItems: readonly NavigationItem[];
};

export function AppShell({ children, navigationItems }: AppShellProps) {
  return (
    <div className="flex h-dvh max-h-dvh min-h-0 w-full overflow-hidden bg-background">
      <div className="hidden shrink-0 lg:block">
        <AppSidebar items={navigationItems} />
      </div>

      <div className="flex h-full max-h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppNavbar items={navigationItems} />
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
          {children}
        </main>
        <MobileBottomNavigation items={navigationItems} />
      </div>
    </div>
  );
}
