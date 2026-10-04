import { ReactNode } from "react";
import { inventory, inventoryStatus } from "@/shared/data/clinic-data";

type ClinicTab = "dashboard" | "pacientes" | "agenda" | "tratamientos" | "pagos" | "inventario";

const lowStock = inventory.filter((i) => inventoryStatus(i) !== "ok").length;

const NAV: { tab: ClinicTab; label: string; icon: ReactNode }[] = [
  { tab: "dashboard", label: "Dashboard", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  { tab: "pacientes", label: "Pacientes", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
  { tab: "agenda", label: "Agenda", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> },
  { tab: "tratamientos", label: "Tratamientos", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { tab: "pagos", label: "Pagos", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg> },
  { tab: "inventario", label: "Inventario", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg> },
];

const BOTTOM_NAV = NAV.map(item => ({
  tab: item.tab,
  label: item.label,
  icon: item.icon,
}));

export default function ClinicLayout({
  activeTab,
  onTabChange,
  dark,
  onToggleDark,
  onSwitchApp,
  title,
  breadcrumbs,
  actions,
  children,
  canGoBack,
  onBack,
}: {
  activeTab: ClinicTab;
  onTabChange: (t: ClinicTab) => void;
  dark: boolean;
  onToggleDark: () => void;
  onSwitchApp: () => void;
  title: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  actions?: ReactNode;
  children: ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
}) {
  return (
    <div className="flex h-full bg-[var(--background)] overflow-hidden">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)]">
        {/* Logo */}
        <div className="h-14 flex items-center px-5 border-b border-[var(--border)] gap-2.5">
          <div className="w-7 h-7 bg-[var(--primary)] rounded-[3px] flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <span className="font-display text-sm font-bold text-[var(--foreground)]">Clínica</span>
            <span className="font-display text-sm font-bold text-[var(--primary)]">MVP</span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ tab, label, icon }) => {
            const active = activeTab === tab;
            const badge = tab === "inventario" && lowStock > 0 ? lowStock : 0;
            return (
              <button
                key={tab}
                onClick={() => onTabChange(tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[3px] text-left transition-colors text-sm font-display font-medium ${active ? "bg-[var(--primary-subtle)] text-[var(--primary)]" : "text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"}`}
              >
                <span className={active ? "text-[var(--primary)]" : "text-[var(--muted)]"}>{icon}</span>
                <span className="flex-1">{label}</span>
                {badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] p-3 flex flex-col gap-1">
          <button onClick={onToggleDark} className="flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-sm text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors w-full">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
            {dark ? "Tema claro" : "Tema oscuro"}
          </button>
          <button onClick={onSwitchApp} className="flex items-center gap-2.5 px-3 py-2 rounded-[3px] text-sm text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] transition-colors w-full">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="15 18 9 12 15 6" /></svg>
            Cambiar sistema
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-[2px] bg-[var(--primary)] flex items-center justify-center text-[var(--primary-foreground)] text-[10px] font-bold flex-shrink-0">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-[var(--foreground)] truncate">Dr. Admin</p>
              <p className="text-[10px] font-mono text-[var(--muted)] truncate">Administrador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="h-14 flex items-center px-4 md:px-6 border-b border-[var(--border)] bg-[var(--surface)] gap-3 flex-shrink-0">
          {canGoBack && onBack && (
            <button onClick={onBack} className="flex items-center gap-1 text-[var(--primary)] hover:opacity-70 text-sm font-medium mr-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              <span className="hidden sm:inline">Atrás</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {breadcrumbs?.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[var(--border)]">/</span>}
                {b.onClick ? (
                  <button onClick={b.onClick} className="text-[var(--muted)] hover:text-[var(--foreground)] font-display transition-colors">{b.label}</button>
                ) : (
                  <span className="font-display font-semibold text-[var(--foreground)]">{b.label}</span>
                )}
              </span>
            ))}
            {!breadcrumbs && <span className="font-display font-semibold text-[var(--foreground)]">{title}</span>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
        <main className="flex-1 overflow-y-auto max-h-full">{children}</main>

        {/* ── Bottom Nav (mobile) ── */}
        <nav className="md:hidden flex-shrink-0 border-t border-[var(--border)] bg-[var(--surface)] overflow-x-auto">
          <div className="flex min-w-full justify-around px-1">
            {BOTTOM_NAV.map(({ tab, label, icon }) => {
              const active = activeTab === tab;
              const badge = tab === "inventario" && lowStock > 0 ? lowStock : 0;
              return (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative min-w-[40px]"
                >
                  <span className={active ? "text-[var(--primary)]" : "text-[var(--muted)]"}>{icon}</span>
                  <span className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${active ? "text-[var(--primary)] font-semibold" : "text-[var(--muted)]"} hidden sm:block`}>
                    {label}
                  </span>
                  {badge > 0 && (
                    <span className="absolute -top-1 right-1 w-4 h-4 rounded-full bg-[var(--danger)] text-white text-[8px] font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                  {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[var(--primary)] rounded-b" />}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center pb-2 pt-1">
            <div className="w-28 h-1 bg-[var(--muted)]/30 rounded-full" />
          </div>
        </nav>
      </div>
    </div>
  );
}

export type { ClinicTab };