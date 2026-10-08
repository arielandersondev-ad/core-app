'use client';

import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useRoles } from '@/features/role/hooks/use-roles';
import { OrganizationSelect } from '../components/organization-select';
import { RoleSelectorPanel } from '../components/role-selector-panel';
import { PermissionEditorPanel } from '../components/permission-editor-panel';
import { AccessFormDialog } from '../components/access-form-dialog';
import { Icons } from '@/shared/components/ui/Icons';
import { usePermissions, useReplaceRolePermissions, useRolePermissions } from '../hooks/use-permissions';
import { CreateRoleDialog } from '../components/create-role-dialog';
import { CreatePermissionDialog } from '../components/create-permission-dialog';
import type { PermissionGroup, PermissionItem } from '../types/role';

function groupPermissions(permissions: readonly PermissionItem[]): PermissionGroup[] {
  const groups = new Map<string, PermissionItem[]>();

  for (const permission of permissions) {
    const resource = permission.code.split(':', 1)[0] || 'other';
    const current = groups.get(resource) ?? [];
    current.push(permission);
    groups.set(resource, current);
  }

  return [...groups.entries()].map(([key, items]) => ({
    key,
    permissions: items.sort((a, b) => a.code.localeCompare(b.code)),
  }));
}

type PermissionSelection = { roleId: string; ids: Set<string> };

export default function RolePage() {
  const [organizationId, setOrganizationId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selection, setSelection] = useState<PermissionSelection | null>(null);
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [dialog, setDialog] = useState<{
    kind: 'role' | 'permission';
    name?: string;
    code?: string;
  } | null>(null);

  const queryRolePermissions = useRolePermissions(selectedRoleId);
  const queryPermissions = usePermissions(Boolean(selectedRoleId));
  const replaceRolePermissions = useReplaceRolePermissions();
  const permissionGroups = useMemo(
    () => groupPermissions(queryPermissions.data ?? []),
    [queryPermissions.data],
  );
  const assignedPermissionIds = useMemo(
    () => new Set(
      (queryRolePermissions.data ?? []).flatMap((group) =>
        group.permissions.map((permission) => permission.id),
      ),
    ),
    [queryRolePermissions.data],
  );
  const savedPermissionIds = assignedPermissionIds;
  const selectedPermissionIds = selection?.roleId === selectedRoleId
    ? selection.ids
    : savedPermissionIds;

  const query = useRoles(organizationId);
  const roles = query.data ?? [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const hasChanges = useMemo(
    () => selectedPermissionIds.size !== savedPermissionIds.size
      || [...selectedPermissionIds].some((id) => !savedPermissionIds.has(id)),
    [savedPermissionIds, selectedPermissionIds],
  );

  const [selectedOrganization, setSelectedOrganization] = useState<{ id: string; name: string } | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  function handleOrganizationChange(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setSelectedRoleId('');
    setSelection(null);
    setIsEditingPermissions(false);
    replaceRolePermissions.reset();
  }

  function handleSelectRole(roleId: string) {
    setSelectedRoleId(roleId);
    setSelection(null);
    setIsEditingPermissions(false);
    replaceRolePermissions.reset();
  }

  function handleTogglePermission(permissionId: string) {
    setSelection((current) => {
      const currentIds = current?.roleId === selectedRoleId ? current.ids : selectedPermissionIds;
      const next = new Set(currentIds);
      if (next.has(permissionId)) next.delete(permissionId);
      else next.add(permissionId);
      return { roleId: selectedRoleId, ids: next };
    });
  }

  function handleDiscardPermissions() {
    setSelection(null);
    setIsEditingPermissions(false);
    replaceRolePermissions.reset();
  }

  async function handleSavePermissions() {
    if (!selectedRoleId) return;

    try {
      await replaceRolePermissions.mutateAsync({
        roleId: selectedRoleId,
        permissionIds: [...selectedPermissionIds],
      });
      setSelection(null);
      setIsEditingPermissions(false);
    } catch {
      // La mutación conserva el error para mostrarlo sin cerrar el modo edición.
    }
  }

  const error = query.isError
    ? isAxiosError(query.error) &&
      typeof query.error.response?.data?.message === 'string'
      ? query.error.response.data.message
      : 'No se pudo cargar el listado de roles.'
    : null;
  const permissionsError = queryPermissions.isError || queryRolePermissions.isError
    ? 'No se pudieron cargar los permisos disponibles para este rol.'
    : null;
  const savePermissionsError = replaceRolePermissions.isError
    ? isAxiosError(replaceRolePermissions.error)
      && typeof replaceRolePermissions.error.response?.data?.message === 'string'
      ? replaceRolePermissions.error.response.data.message
      : 'No se pudieron guardar los permisos del rol.'
    : null;

  return (
    <section className="mx-auto w-full max-w-[1440px] p-4 md:p-8">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary">Administración de acceso</p>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Roles y permisos
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Configura qué puede consultar y administrar cada rol dentro de la plataforma.
          </p>
        </div>
        <OrganizationSelect
          value={selectedOrganization?.id ?? ''}
          onChange={(organization) => {
            setSelectedOrganization(organization);
            handleOrganizationChange(organization?.id ?? '');
          }}
        />
      </header>

      {!organizationId && (
        <div className="mt-8 flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface px-6 text-center">
          <h2 className="font-display text-lg font-semibold">Selecciona una organización</h2>
          <p className="mt-1 max-w-md text-sm text-muted">Elige una organización para consultar sus roles y comenzar a configurar permisos.</p>
        </div>
      )}

      {organizationId && query.isPending && (
        <div role="status" className="mt-8 grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="h-80 animate-pulse rounded-lg border border-border bg-surface" />
          <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
          <span className="sr-only">Cargando roles…</span>
        </div>
      )}

      {organizationId && error && (
        <div
          role="alert"
          className="mt-8 rounded-md border border-danger/30 bg-danger-subtle p-4 text-sm text-danger"
        >
          {error}

          <button
            type="button"
            onClick={() => void query.refetch()}
            className="ml-2 underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {organizationId && !query.isPending && !error && (
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <RoleSelectorPanel
            roles={roles}
            selectedRoleId={selectedRoleId}
            onSelectRole={handleSelectRole}
            onCreateRole={() => setIsCreateRoleOpen(true)}
          />
          {selectedRole && (queryPermissions.isPending || queryRolePermissions.isPending) ? (
            <div role="status" className="h-96 animate-pulse rounded-lg border border-border bg-surface">
              <span className="sr-only">Cargando permisos…</span>
            </div>
          ) : selectedRole && permissionsError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-subtle p-4 text-sm text-danger">
              {permissionsError}
              <button
                type="button"
                onClick={() => void Promise.all([queryPermissions.refetch(), queryRolePermissions.refetch()])}
                className="ml-2 underline"
              >
                Reintentar
              </button>
            </div>
          ) : (
            <PermissionEditorPanel
              roleName={selectedRole?.name}
              roleCode={selectedRole?.code}
              readOnly={selectedRole?.organizationId === null}
              isEditing={isEditingPermissions}
              permissionGroups={permissionGroups}
              selectedPermissionIds={selectedPermissionIds}
              totalPermissions={queryPermissions.data?.length ?? 0}
              hasChanges={hasChanges}
              isSaving={replaceRolePermissions.isPending}
              saveError={savePermissionsError}
              onToggle={handleTogglePermission}
              onStartEditing={() => {
                replaceRolePermissions.reset();
                setIsEditingPermissions(true);
              }}
              onDiscard={handleDiscardPermissions}
              onSave={handleSavePermissions}
              onEditRole={() => setDialog({ kind: 'role', name: selectedRole?.name, code: selectedRole?.code })}
              onCreatePermission={() => setIsCreatePermissionOpen(true)}
              onEditPermission={(code, name) => setDialog({ kind: 'permission', code, name })}
            />
          )}
        </div>
      )}

      {selectedOrganization && (
        <button
          type="button"
          onClick={() => setIsCreateRoleOpen(true)}
          className="fixed bottom-20 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-display text-sm font-semibold text-primary-foreground shadow-xl transition-transform active:scale-95 lg:hidden"
        >
          <span aria-hidden="true">{Icons.plus}</span>
          Nuevo rol
        </button>
      )}

      {selectedOrganization && (
        <CreateRoleDialog
          open={isCreateRoleOpen}
          organizationId={selectedOrganization.id}
          organizationName={selectedOrganization.name}
          onClose={() => setIsCreateRoleOpen(false)}
        />
      )}

      {isCreatePermissionOpen && (
        <CreatePermissionDialog
          open
          onClose={() => setIsCreatePermissionOpen(false)}
        />
      )}

      {dialog && (
        <AccessFormDialog
          open
          kind={dialog.kind}
          initialName={dialog.name}
          initialCode={dialog.code}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
