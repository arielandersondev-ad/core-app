'use client';

import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useRoles } from '@/features/role/hooks/use-roles';
import { OrganizationSelect } from '../components/organization-select';
import { RoleSelectorPanel } from '../components/role-selector-panel';
import { PermissionEditorPanel } from '../components/permission-editor-panel';
import { AccessFormDialog } from '../components/access-form-dialog';
import { Icons } from '@/shared/components/ui/Icons';
import { useRolePermissions } from '../hooks/use-role-permission';
import { CreateRoleDialog } from '../components/create-role-dialog';

export default function RolePage() {
  const [organizationId, setOrganizationId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [savedCodes, setSavedCodes] = useState<Set<string>>(new Set());
  const [dialog, setDialog] = useState<{
    kind: 'role' | 'permission';
    mode: 'create' | 'edit';
    name?: string;
    code?: string;
  } | null>(null);

  const queryPermissions = useRolePermissions(selectedRoleId)
  const permissionGroups = queryPermissions.data ?? [];

  const query = useRoles(organizationId);
  const roles = query.data ?? [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const hasChanges = useMemo(
    () => selectedCodes.size !== savedCodes.size || [...selectedCodes].some((code) => !savedCodes.has(code)),
    [savedCodes, selectedCodes],
  );

  const [selectedOrganization, setSelectedOrganization] = useState<{ id: string; name: string } | null>(null);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  function handleOrganizationChange(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setSelectedRoleId('');
    setSelectedCodes(new Set());
    setSavedCodes(new Set());
  }

  function handleSelectRole(roleId: string) {
    setSelectedRoleId(roleId);
    setSelectedCodes(new Set());
    setSavedCodes(new Set());
  }

  function handleTogglePermission(code: string) {
    setSelectedCodes((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  const error = query.isError
    ? isAxiosError(query.error) &&
      typeof query.error.response?.data?.message === 'string'
      ? query.error.response.data.message
      : 'No se pudo cargar el listado de roles.'
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
          <PermissionEditorPanel
            roleName={selectedRole?.name}
            roleCode={selectedRole?.code}
            readOnly={selectedRole?.organizationId === null}
            permissionGroups={permissionGroups}
            selectedCodes={selectedCodes}
            hasChanges={hasChanges}
            onToggle={handleTogglePermission}
            onDiscard={() => setSelectedCodes(new Set(savedCodes))}
            onSave={() => setSavedCodes(new Set(selectedCodes))}
            onEditRole={() => setDialog({ kind: 'role', mode: 'edit', name: selectedRole?.name, code: selectedRole?.code })}
            onCreatePermission={() => setDialog({ kind: 'permission', mode: 'create' })}
            onEditPermission={(code, name) => setDialog({ kind: 'permission', mode: 'edit', code, name })}
          />
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

      {dialog && (
        <AccessFormDialog
          open
          kind={dialog.kind}
          mode={dialog.mode}
          initialName={dialog.name}
          initialCode={dialog.code}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
