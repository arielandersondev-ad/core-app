'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Toggle, Button, Card, Separator } from '@/shared/components/ui';
import { useUsers } from '@/features/user/hooks/use-users';
import { type Permission, MODULES } from '@/shared/utils/format';

export default function Permissions() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const { data: users = [], isLoading } = useUsers();
  const rawUser = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  const user = useMemo(() => {
    if (!rawUser) return null;
    return {
      id: rawUser.id,
      name: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || rawUser.email,
      email: rawUser.email,
    };
  }, [rawUser]);

  const [permissions, setPermissions] = useState<Permission[]>(() =>
    MODULES.map((m) => ({ module: m, view: false, create: false, edit: false, delete: false }))
  );
  const [saved, setSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm font-mono text-muted-foreground">Cargando permisos...</p>
      </div>
    );
  }

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
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Permisos granulares para <strong className="text-foreground">{user.name}</strong>.
            Los cambios sobrescriben los permisos base del rol asignado.
          </p>
        </div>
        {saved && (
          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-xs">
            ✓ Guardado
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {permissions.map((perm) => {
          const allActive = perm.view && perm.create && perm.edit && perm.delete;
          return (
            <Card key={perm.module} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{perm.module}</p>
                <button
                  type="button"
                  onClick={() => toggleAll(perm.module, !allActive)}
                  className="text-[11px] font-mono text-primary hover:underline mt-0.5"
                >
                  {allActive ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              {/* Controles: responsive con etiquetas en móvil */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex items-center gap-3 md:gap-6 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                {actions.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between md:justify-start gap-2 bg-muted/40 md:bg-transparent p-2 md:p-0 rounded-xs">
                    <span className="text-xs text-muted-foreground md:hidden">{label}</span>
                    <Toggle
                      checked={perm[key]}
                      onChange={(v) => update(perm.module, key, v)}
                    />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button onClick={() => setSaved(true)} size="lg">
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
