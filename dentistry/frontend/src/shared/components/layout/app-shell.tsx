import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { AppNavbar } from "./app-navbar";
import { BottomNav } from "./bottom-nav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh bg-background">
      {/* Sidebar: desktop only */}
      <div className="hidden lg:flex">
        <AppSidebar />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0">
        <AppNavbar />
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
