'use client';

import { useMemo, useState } from 'react';
import type { RoleListItem } from '@/features/role/types/role';
import { Badge } from '@/shared/components/ui/Badge';
import { Icons } from '@/shared/components/ui/Icons';

type RoleSelectorPanelProps = {
  roles: RoleListItem[];
  selectedRoleId: string;
  onSelectRole: (roleId: string) => void;
  onCreateRole: () => void;
};

export function RoleSelectorPanel({
  roles,
  selectedRoleId,
  onSelectRole,
  onCreateRole,
}: RoleSelectorPanelProps) {
  const [search, setSearch] = useState('');
  const filteredRoles = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    if (!term) return roles;

    return roles.filter((role) =>
      [role.name, role.code, role.description]
        .filter(Boolean)
        .some((value) => value?.toLocaleLowerCase('es').includes(term)),
    );
  }, [roles, search]);

  return (
    <aside className="overflow-hidden rounded-lg border border-border bg-surface lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Roles</h2>
            <p className="mt-0.5 text-xs text-muted">
              {roles.length} disponibles en este alcance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" size="md">{roles.length}</Badge>
            <button
              type="button"
              onClick={onCreateRole}
              className="hidden h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 lg:flex"
            >
              <span aria-hidden="true">{Icons.plus}</span>
              Nuevo
            </button>
          </div>
        </div>

        <label className="relative mt-4 block">
          <span className="sr-only">Buscar un rol</span>
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted" aria-hidden="true">
            {Icons.search}
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o código"
            className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <div className="max-h-[28rem] overflow-y-auto p-2 lg:max-h-[calc(100vh-20rem)]">
        {filteredRoles.length > 0 ? (
          <div className="space-y-1" role="listbox" aria-label="Roles disponibles">
            {filteredRoles.map((role) => {
              const selected = selectedRoleId === role.id;
              const global = role.organizationId === null;

              return (
                <button
                  key={role.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelectRole(role.id)}
                  className={`flex w-full items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors ${
                    selected
                      ? 'border-primary bg-primary-subtle text-foreground'
                      : 'border-transparent hover:border-border hover:bg-background'
                  }`}
                >
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${selected ? 'bg-primary text-primary-foreground' : 'bg-neutral-subtle text-muted'}`}>
                    {Icons.shield}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{role.name}</span>
                      {global && <Badge variant="warning">Global</Badge>}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[11px] text-muted">{role.code}</span>
                  </span>
                  <span className="shrink-0 text-muted" aria-hidden="true">{Icons.chevronRight}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-medium">No encontramos roles</p>
            <p className="mt-1 text-xs text-muted">Prueba con otro nombre o código.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
