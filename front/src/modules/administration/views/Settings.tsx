'use client';

import { Card, Separator, Toggle, SectionHeader, Icons } from '@/shared/components/ui';
import { useTheme } from '@/infrastructure/hooks/useTheme';

export default function Settings() {
  const { dark, toggleDark } = useTheme();

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6 max-w-3xl mx-auto">
      {/* Profile */}
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-sm bg-stone-800 dark:bg-stone-700 flex items-center justify-center font-display font-bold text-lg text-white shrink-0">
          SA
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-foreground">Super Admin</p>
          <p className="text-[11px] font-mono text-muted-foreground">admin@sistema.com</p>
          <span className="mt-1 inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-[2px] bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300">
            Super Admin
          </span>
        </div>
        <button className="h-9 px-4 border border-border rounded-[3px] text-sm font-semibold text-muted hover:text-foreground hover:border-foreground/30 transition-colors">
          Editar perfil
        </button>
      </Card>

      <SectionHeader>Apariencia</SectionHeader>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 md:px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{dark ? Icons.moon : Icons.sun}</span>
            <div>
              <p className="text-sm font-display font-semibold text-foreground">Modo oscuro</p>
              <p className="text-[11px] text-muted-foreground">{dark ? 'Tema oscuro activo' : 'Tema claro activo'}</p>
            </div>
          </div>
          <Toggle checked={dark} onChange={toggleDark} />
        </div>
      </Card>

      <SectionHeader>Sistema</SectionHeader>
      <Card className="overflow-hidden">
        {[
          { icon: Icons.shield, label: 'Auditoría del sistema', desc: 'Registro de actividad global' },
          { icon: Icons.settings, label: 'Configuración global', desc: 'Parámetros del sistema' },
          { icon: Icons.users, label: 'Roles y permisos', desc: 'Gestión de privilegios' },
        ].map((item, i, arr) => (
          <div key={item.label}>
            <button className="w-full flex items-center gap-3 px-4 md:px-5 py-4 active:bg-muted text-left">
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

      <SectionHeader>Información</SectionHeader>
      <Card className="overflow-hidden">
        <div className="px-4 md:px-5 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Versión</p>
          <p className="text-sm font-mono text-foreground mt-0.5">2.4.1 · Producción</p>
        </div>
        <Separator />
        <div className="px-4 md:px-5 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Entorno</p>
          <p className="text-sm font-mono text-foreground mt-0.5">AWS · us-east-1</p>
        </div>
        <Separator />
        <div className="px-4 md:px-5 py-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Última actualización</p>
          <p className="text-sm font-mono text-foreground mt-0.5">20 ago 2026 · 03:00 UTC</p>
        </div>
      </Card>

      <SectionHeader>Sesión</SectionHeader>
      <Card className="overflow-hidden">
        <button className="w-full flex items-center gap-3 px-4 md:px-5 py-4 active:opacity-70 text-left">
          <span className="text-danger">{Icons.logout}</span>
          <p className="text-sm font-display font-semibold text-danger">Cerrar sesión</p>
        </button>
      </Card>
    </div>
  );
}