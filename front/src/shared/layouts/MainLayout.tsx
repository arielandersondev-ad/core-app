'use client';

import { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icons } from '@/shared/components/ui/Icons';
import { useTheme } from '@/infrastructure/hooks/useTheme';

type Tab = 'dashboard' | 'users' | 'orgs' | 'settings';

const NAV = [
  { tab: 'dashboard' as Tab, icon: Icons.dashboard, label: 'Inicio' },
  { tab: 'users' as Tab, icon: Icons.users, label: 'Usuarios' },
  { tab: 'orgs' as Tab, icon: Icons.building, label: 'Organizaciones' },
  { tab: 'settings' as Tab, icon: Icons.settings, label: 'Configuración' },
];

const routeMap: Record<Tab, string> = {
  dashboard: '/dashboard',
  users: '/dashboard/users',
  orgs: '/dashboard/organizations',
  settings: '/dashboard/settings',
};

const TITLE_MAP: Record<Tab, string> = {
  dashboard: 'Inicio',
  users: 'Usuarios',
  orgs: 'Organizaciones',
  settings: 'Configuración',
};

const tabFromPath = (path: string): Tab => {
  if (path === '/dashboard' || path === '/') return 'dashboard';
  if (path.startsWith('/dashboard/users')) return 'users';
  if (path.startsWith('/dashboard/organizations')) return 'orgs';
  if (path.startsWith('/dashboard/settings')) return 'settings';
  return 'dashboard';
};

export default function MainLayout({
  title,
  breadcrumbs,
  actions,
  children,
  canGoBack,
  onBack,
}: {
  title: string;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  actions?: ReactNode;
  children: ReactNode;
  canGoBack?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { dark, toggleDark } = useTheme();
  const activeTab = tabFromPath(pathname);

  const switchTab = (tab: Tab) => {
    router.push(routeMap[tab]);
  };

  // Si breadcrumbs no está definido, usamos el título mapeado o el prop title
  const displayTitle = breadcrumbs ? undefined : (TITLE_MAP[activeTab] || title);

  return (
    <div className="flex h-full bg-background">
      {/* ── Sidebar (solo desktop) ── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-surface">
        {/* Logo ... (igual) */}
        <div className="h-14 flex items-center px-5 border-b border-border gap-2.5">
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
              <rect x="1" y="1" width="4" height="4" fill="white" />
              <rect x="7" y="1" width="4" height="4" fill="white" />
              <rect x="1" y="7" width="4" height="4" fill="white" />
              <rect x="7" y="7" width="4" height="4" fill="white" opacity="0.45" />
            </svg>
          </div>
          <span className="font-display text-sm font-bold tracking-wide text-foreground">
            LosMonos<span className="text-primary">Admin</span>
          </span>
        </div>

        <nav className="flex-1 py-4 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV.map(({ tab, icon, label }) => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm text-left transition-colors text-sm font-display font-medium ${
                  active
                    ? 'bg-primary-subtle text-primary'
                    : 'text-muted hover:bg-background hover:text-foreground'
                }`}
              >
                <span className={active ? 'text-primary' : 'text-muted'}>{icon}</span>
                {label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 flex flex-col gap-2">
          <button
            onClick={toggleDark}
            className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted hover:bg-background hover:text-foreground transition-colors w-full"
          >
            <span>{dark ? Icons.sun : Icons.moon}</span>
            {dark ? 'Tema claro' : 'Tema oscuro'}
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-sm">
            <div className="w-7 h-7 rounded-xs bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-display font-bold shrink-0">
              SA
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-display font-semibold text-foreground truncate">Super Admin</p>
              <p className="text-[10px] font-mono text-muted truncate">admin@sistema.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Topbar */}
        <header className="h-14 flex items-center px-4 md:px-6 border-b border-border bg-surface gap-3 shrink-0">
          {canGoBack && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-primary hover:opacity-70 transition-opacity mr-1 text-sm font-medium"
            >
              {Icons.chevronLeft}
              <span className="hidden sm:inline">Atrás</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
            {breadcrumbs ? (
              breadcrumbs.map((b, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-border">/</span>}
                  {b.onClick ? (
                    <button
                      onClick={b.onClick}
                      className="text-muted hover:text-foreground transition-colors font-display"
                    >
                      {b.label}
                    </button>
                  ) : (
                    <span className="font-display font-semibold text-foreground truncate">{b.label}</span>
                  )}
                </span>
              ))
            ) : (
              <span className="font-display font-semibold text-foreground truncate">
                {displayTitle}
              </span>
            )}
          </div>

          {/* Acciones (desktop) y Toggle de tema (mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            {actions && <div className="hidden md:flex items-center gap-2">{actions}</div>}
            {/* Toggle de tema en mobile (solo cuando no hay "Atrás") */}
            {!canGoBack && (
              <button
                onClick={toggleDark}
                className="md:hidden p-2 text-muted hover:text-foreground transition-colors"
                aria-label="Cambiar tema"
              >
                {dark ? Icons.sun : Icons.moon}
              </button>
            )}
          </div>
        </header>

        {/* Contenido de la página con scroll */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* ── Bottom Nav (solo mobile) ── */}
        <nav className="md:hidden flex-shrink-0 border-t border-border bg-surface">
          <div className="flex">
            {NAV.map(({ tab, icon, label }) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => switchTab(tab)}
                  className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
                >
                  <span className={active ? 'text-primary' : 'text-muted'}>
                    {icon}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-widest transition-colors ${
                      active ? 'text-primary font-semibold' : 'text-muted'
                    }`}
                  >
                    {label}
                  </span>
                  {active && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-center pb-2 pt-1">
            <div className="w-28 h-1 bg-muted/30 rounded-full" />
          </div>
        </nav>
      </div>
    </div>
  );
}