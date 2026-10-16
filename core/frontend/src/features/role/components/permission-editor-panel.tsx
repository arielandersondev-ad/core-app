'use client';

import { useId, useState } from 'react';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Icons } from '@/shared/components/ui/Icons';
import { getPermissionGroupPresentation } from '../data/permission-group-presentation';
import type { PermissionGroup } from '../types/role';

type PermissionEditorPanelProps = {
  roleName?: string;
  roleCode?: string;
  readOnly?: boolean;
  isEditing: boolean;
  permissionGroups: readonly PermissionGroup[];
  selectedPermissionIds: ReadonlySet<string>;
  totalPermissions: number;
  hasChanges: boolean;
  isSaving: boolean;
  saveError?: string | null;
  onToggle: (permissionId: string) => void;
  onStartEditing: () => void;
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
  isEditing,
  permissionGroups,
  selectedPermissionIds,
  totalPermissions,
  hasChanges,
  isSaving,
  saveError,
  onToggle,
  onStartEditing,
  onDiscard,
  onSave,
  onEditRole,
  onCreatePermission,
  onEditPermission,
}: PermissionEditorPanelProps) {
  const accordionId = useId();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  function toggleGroup(groupKey: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }

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
              <span className="font-semibold text-foreground">{selectedPermissionIds.size}</span>
              de {totalPermissions} permisos asignados
            </div>
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={onEditRole}>Editar rol</Button>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={onStartEditing}>Editar permisos</Button>
                )}
              </>
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
            {isEditing
              ? 'Selecciona las acciones que necesita este rol y guarda los cambios cuando termines.'
              : 'Los permisos están en modo de consulta. Presiona Editar permisos para modificarlos.'}
          </p>
        )}
      </header>

      <div className="divide-y divide-border">
        {[...permissionGroups]
          .sort((groupA, groupB) => {
            const presentationA = getPermissionGroupPresentation(groupA.key);
            const presentationB = getPermissionGroupPresentation(groupB.key);
            return presentationA.order - presentationB.order || groupA.key.localeCompare(groupB.key);
          })
          .map((group) => {
            const presentation = getPermissionGroupPresentation(group.key);
            const expanded = expandedGroups.has(group.key);
            const panelId = `${accordionId}-${group.key}`;
            const assignedCount = group.permissions.filter((permission) =>
              selectedPermissionIds.has(permission.id),
            ).length;

            return (
              <section key={group.key}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:px-6"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-semibold">
                      {presentation.label}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-muted">
                      {presentation.description}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">
                    {assignedCount}/{group.permissions.length}
                  </span>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className={`size-5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expanded && (
                  <fieldset
                    id={panelId}
                    className="border-t border-border px-4 pb-5 pt-4 sm:px-6"
                    disabled={readOnly || !isEditing || isSaving}
                  >
                    <legend className="sr-only">Permisos de {presentation.label}</legend>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {group.permissions.map((permission) => {
                        const checked = selectedPermissionIds.has(permission.id);

                        return (
                          <div
                            key={permission.code}
                            className={`relative flex min-h-24 items-start gap-3 rounded-md border p-3 pr-10 transition-colors ${
                              checked ? 'border-primary bg-primary-subtle' : 'border-border bg-background hover:border-primary/50'
                            } ${readOnly || !isEditing ? 'opacity-80' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => onToggle(permission.id)}
                              aria-label={`Asignar ${permission.name}`}
                              className="mt-0.5 size-4 shrink-0 accent-primary"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{permission.name}</span>
                              {permission.description && (
                                <span className="mt-1 block text-xs leading-5 text-muted">
                                  {permission.description}
                                </span>
                              )}
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
                )}
              </section>
            );
          })}
      </div>

      {!readOnly && isEditing && (
        <footer className="sticky bottom-0 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur sm:px-6">
          {saveError && (
            <p role="alert" className="mb-3 rounded-md border border-danger/30 bg-danger-subtle p-3 text-sm text-danger">
              {saveError}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button variant="ghost" onClick={onDiscard} disabled={isSaving}>Cancelar</Button>
            <Button onClick={onSave} disabled={!hasChanges || isSaving}>
              <span aria-hidden="true">{Icons.check}</span>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </footer>
      )}
    </section>
  );
}
