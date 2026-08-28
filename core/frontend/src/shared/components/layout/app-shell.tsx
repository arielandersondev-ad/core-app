import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import type { NavigationItem } from "@/shared/navigation/navigation.types";

type AppShellProps = {
  children: ReactNode;
  navigationItems: readonly NavigationItem[];
};

export function AppShell({ children, navigationItems }: AppShellProps) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden shrink-0 lg:block">
        <AppSidebar items={navigationItems} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <main
          id="main-content"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {children}
        </main>
      </div>
    </div>
  );
}