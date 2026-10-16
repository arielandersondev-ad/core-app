// Re-export standardized layout primitives from @app/ui
export { PageContainer, PageHeader, FilterToolbar } from "@app/ui";
export type {
  PageContainerProps,
  PageHeaderProps,
  FilterToolbarProps,
  BreadcrumbItem,
} from "@app/ui";

// Vertical-specific layout components
export { AppShell } from "./app-shell";
export { AppSidebar } from "./app-sidebar";
export { AppNavbar } from "./app-navbar";
export { BottomNav } from "./bottom-nav";
export { NAV_ITEMS, SECTION_TITLES } from "./navigation";
