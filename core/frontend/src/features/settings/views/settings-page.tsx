'use client';

import type { ReactNode } from 'react';
import {
  Card,
  Separator,
  SectionHeader,
  Icons,
  THEME_DESCRIPTIONS,
  THEME_LABELS,
  THEME_OPTIONS,
  themeHasEffects,
  useThemeEffects,
  useThemePreference,
  type ThemePreference,
} from '@/shared/components/ui';
import { logoutAction } from '@/features/auth/actions/logout-action';

const THEME_ICONS: Record<ThemePreference, ReactNode> = {
  light: Icons.sun,
  dark: Icons.moon,
  winter: Icons.snowflake,
  christmas: Icons.tree,
  system: Icons.monitor,
};

export default function Settings() {
  const { preference, setPreference } = useThemePreference();
  const { paused, togglePaused } = useThemeEffects();

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6 max-w-3xl mx-auto bg-background">

      {/* ── Perfil (unificado: Card + botón en todos los tamaños) ── */}
      <Card className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-sm bg-stone-800 dark:bg-stone-700 flex items-center justify-center font-display font-bold text-lg md:text-xl text-white shrink-0">
          SA
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="font-display text-lg md:text-xl font-bold text-foreground">Super Admin</p>
          <p className="text-[11px] md:text-sm font-mono text-muted-foreground">admin@sistema.com</p>
          <span className="mt-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-xs bg-primary-subtle text-primary">
            Super Administrador
          </span>
        </div>
        <button className="h-9 px-4 border border-border rounded-sm text-sm font-semibold text-muted hover:text-foreground hover:bg-muted/10 transition-colors w-full md:w-auto">
          Editar perfil
        </button>
      </Card>

      <Separator className="mx-4" />

      {/* ── Apariencia ── */}
      <SectionHeader>Apariencia</SectionHeader>
      <Card className="mx-4">
        <fieldset className="px-4 py-4">
          <legend className="sr-only">Tema de la interfaz</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {THEME_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-3 transition-colors hover:bg-muted/5 has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/40"
              >
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  checked={preference === option}
                  onChange={() => setPreference(option)}
                  className="sr-only"
                />
                <span aria-hidden="true" className="text-muted-foreground">{THEME_ICONS[option]}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-display font-semibold text-foreground">
                    {THEME_LABELS[option]}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {THEME_DESCRIPTIONS[option]}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        {themeHasEffects(preference) && (
          <>
            <Separator />
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <div>
                <p className="text-sm font-display font-semibold text-foreground">Animaciones del tema</p>
                <p className="text-[11px] text-muted-foreground">
                  {paused ? 'Luces fijas y sin nieve' : 'Luces que titilan y nieve ligera'}
                </p>
              </div>
              <button
                type="button"
                onClick={togglePaused}
                className="h-9 shrink-0 rounded-sm border border-border px-4 text-sm font-semibold text-muted transition-colors hover:bg-muted/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                {paused ? 'Reanudar animaciones' : 'Pausar animaciones'}
              </button>
            </div>
          </>
        )}
      </Card>

      {/* ── Sistema ── */}
      <SectionHeader>Sistema</SectionHeader>
      <Card className="mx-4">
        {[
          {
            icon: Icons.shield,
            label: 'Auditoría del sistema',
            desc: 'Registro de actividad global',
          },
          {
            icon: Icons.settings,
            label: 'Configuración global',
            desc: 'Parámetros de la plataforma',
          },
          {
            icon: Icons.users,
            label: 'Roles y permisos globales',
            desc: 'Gestión de privilegios del sistema',
          },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <button className="w-full flex items-center gap-3 px-4 py-4 active:bg-muted/20 text-left hover:bg-muted/5 transition-colors">
              <span className="text-muted-foreground">{item.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-display font-semibold text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <span className="text-muted-foreground">{Icons.chevronRight}</span>
            </button>
            {i < arr.length - 1 && <Separator />}
          </div>
        ))}
      </Card>

      {/* ── Información del sistema ── */}
      <SectionHeader>Información del sistema</SectionHeader>
      <Card className="mx-4">
        <div className="px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Versión</p>
          <p className="text-sm font-mono text-foreground mt-0.5">2.4.1 · Producción</p>
        </div>
        <Separator />
        <div className="px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Entorno</p>
          <p className="text-sm font-mono text-foreground mt-0.5">AWS · us-east-1</p>
        </div>
        <Separator />
        <div className="px-4 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Última actualización</p>
          <p className="text-sm font-mono text-foreground mt-0.5">20 ago 2026 · 03:00 UTC</p>
        </div>
      </Card>

      {/* ── Sesión ── */}
      <SectionHeader>Sesión</SectionHeader>
      <Card className="mx-4 mb-8">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-4 py-4 active:opacity-70 text-left hover:bg-muted/5 transition-colors"
          >
            <span className="text-danger">{Icons.logout}</span>
            <span className="text-sm font-display font-semibold text-danger">Cerrar sesión</span>
          </button>
        </form>
      </Card>
    </div>
  );
}
