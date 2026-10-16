'use client';

import { Card, Separator, Toggle, SectionHeader, Icons } from '@/shared/components/ui';
import { useTheme } from '@/shared/hooks/use-theme';
import { logoutAction } from '@/features/auth/actions/logout-action';

export default function Settings() {
  const { dark, toggleDark } = useTheme();

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
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{dark ? Icons.moon : Icons.sun}</span>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">
                {dark ? 'Tema oscuro' : 'Tema claro'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {dark ? 'Interfaz oscura activa' : 'Interfaz clara activa'}
              </p>
            </div>
          </div>
          <Toggle checked={dark} onChange={toggleDark} />
        </div>
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
