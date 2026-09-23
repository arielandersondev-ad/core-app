'use client';

import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Icons } from '@/shared/components/ui/Icons';

type PermissionOption = {
  code: string;
  name: string;
  description: string;
};

type PermissionGroup = {
  label: string;
  description: string;
  permissions: readonly PermissionOption[];
};

type PermissionEditorPanelProps = {
  roleName?: string;
  roleCode?: string;
  readOnly?: boolean;
  groups: readonly PermissionGroup[];
  selectedCodes: ReadonlySet<string>;
  hasChanges: boolean;
  onToggle: (code: string) => void;
  onDiscard: () => void;
  onSave: () => void;
  onEditRole: () => void;
  onCreatePermission: () => void;
  onEditPermission: (code: string, name: string) => void;
};

export function PermissionEditorPanel({
  roleName,
  roleCode,
  readOnly = false,
  groups,
  selectedCodes,
  hasChanges,
  onToggle,
  onDiscard,
  onSave,
  onEditRole,
  onCreatePermission,
  onEditPermission,
}: PermissionEditorPanelProps) {
  if (!roleName) {
    return (
      <section className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary" aria-hidden="true">
          {Icons.shield}
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold">Selecciona un rol</h2>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Elige un rol del listado para revisar y administrar sus permisos.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-surface">
      <header className="border-b border-border px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold">{roleName}</h2>
              {readOnly && <Badge variant="warning">Rol global</Badge>}
            </div>
            <p className="mt-1 font-mono text-xs text-muted">{roleCode}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 flex items-center gap-1 text-sm text-muted">
              <span className="font-semibold text-foreground">{selectedCodes.size}</span>
              permisos activos
            </div>
            {!readOnly && (
              <Button variant="outline" size="sm" onClick={onEditRole}>Editar rol</Button>
            )}
            <Button size="sm" onClick={onCreatePermission}>
              <span aria-hidden="true" className="[&>svg]:size-4">{Icons.plus}</span>
              Nuevo permiso
            </Button>
          </div>
        </div>

        {readOnly ? (
          <div className="mt-4 flex gap-3 rounded-md border border-warning/30 bg-warning-subtle px-3 py-3 text-sm text-warning">
            <span className="mt-0.5 shrink-0" aria-hidden="true">{Icons.lock}</span>
            <p>Este rol es global. Puedes revisar sus permisos, pero su edición está protegida.</p>
          </div>
        ) : (
          <p className="mt-4 max-w-2xl text-sm text-muted">
            Activa solo las acciones que necesita este rol. Los cambios se aplicarán cuando los guardes.
          </p>
        )}
      </header>

      <div className="divide-y divide-border">
        {groups.map((group) => {
          const activeCount = group.permissions.filter((permission) => selectedCodes.has(permission.code)).length;

          return (
            <fieldset key={group.label} className="p-4 sm:p-6" disabled={readOnly}>
              <legend className="w-full">
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block font-display text-sm font-semibold">{group.label}</span>
                    <span className="mt-1 block text-xs font-normal text-muted">{group.description}</span>
                  </span>
                  <Badge variant={activeCount > 0 ? 'primary' : 'neutral'}>{activeCount}/{group.permissions.length}</Badge>
                </span>
              </legend>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {group.permissions.map((permission) => {
                  const checked = selectedCodes.has(permission.code);

                  return (
                    <div
                      key={permission.code}
                      className={`relative flex min-h-24 items-start gap-3 rounded-md border p-3 pr-10 transition-colors ${
                        checked ? 'border-primary bg-primary-subtle' : 'border-border bg-background hover:border-primary/50'
                      } ${readOnly ? 'opacity-80' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(permission.code)}
                        aria-label={`Asignar ${permission.name}`}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold">{permission.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-muted">{permission.description}</span>
                        <span className="mt-2 block break-all font-mono text-[10px] text-muted">{permission.code}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onEditPermission(permission.code, permission.name)}
                        aria-label={`Editar permiso ${permission.name}`}
                        className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-foreground"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {!readOnly && (
        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button variant="ghost" onClick={onDiscard} disabled={!hasChanges}>Descartar</Button>
          <Button onClick={onSave} disabled={!hasChanges}>
            <span aria-hidden="true">{Icons.check}</span>
            Guardar cambios
          </Button>
        </footer>
      )}
    </section>
  );
}
