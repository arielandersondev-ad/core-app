'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Toggle, Button, Card, Separator } from '@/shared/components/ui';
import { getUserById, Permission, MODULES } from '@/modules/organization/__mocks__/data';

export default function Permissions() {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const user = getUserById(userId);

  const [permissions, setPermissions] = useState<Permission[]>(
    user?.permissions ??
      MODULES.map((m) => ({ module: m, view: false, create: false, edit: false, delete: false }))
  );
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const update = (module: string, action: keyof Omit<Permission, 'module'>, value: boolean) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.module !== module) return p;
        const updated = { ...p, [action]: value };
        if (action === 'view' && !value) {
          return { ...updated, create: false, edit: false, delete: false };
        }
        if (action !== 'view' && value) {
          return { ...updated, view: true };
        }
        return updated;
      })
    );
    setSaved(false);
  };

  const toggleAll = (module: string, allOn: boolean) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === module
          ? { module, view: allOn, create: allOn, edit: allOn, delete: allOn }
          : p
      )
    );
    setSaved(false);
  };

  const actions: { key: keyof Omit<Permission, 'module'>; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'create', label: 'Crear' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Eliminar' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full gap-5">
      <p className="text-sm text-muted-foreground">
        Configura los accesos de <strong className="text-foreground">{user.name}</strong> a los módulos del sistema.
      </p>

      {/* Encabezados de columnas */}
      <div className="hidden md:flex items-center px-4">
        <div className="flex-1" />
        {actions.map((a) => (
          <div key={a.key} className="w-20 text-center">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{a.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {permissions.map((perm) => {
          const allOn = perm.view && perm.create && perm.edit && perm.delete;
          return (
            <Card key={perm.module} className="overflow-hidden">
              <div className="flex items-center px-4 py-2.5 bg-muted/50">
                <p className="flex-1 text-xs font-display font-semibold text-foreground">
                  {perm.module}
                </p>
                <button
                  onClick={() => toggleAll(perm.module, !allOn)}
                  className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-xs transition-colors ${
                    allOn ? 'bg-primary text-primary-foreground' : 'bg-border text-muted-foreground'
                  }`}
                >
                  {allOn ? 'Todo activo' : 'Activar todo'}
                </button>
              </div>
              <Separator />
              <div className="flex items-center px-4 py-3">
                <div className="flex-1" />
                {actions.map((a) => (
                  <div key={a.key} className="w-12 md:w-20 flex justify-center">
                    <Toggle
                      checked={perm[a.key]}
                      onChange={(v) => update(perm.module, a.key, v)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex gap-3 mt-2">
        {saved ? (
          <div className="flex-1 h-10 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Cambios guardados
          </div>
        ) : (
          <Button onClick={() => setSaved(true)} fullWidth size="lg">
            Guardar permisos
          </Button>
        )}
      </div>
    </div>
  );
}