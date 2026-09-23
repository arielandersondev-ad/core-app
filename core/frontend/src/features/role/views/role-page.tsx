'use client';

import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useRoles } from '@/features/role/hooks/use-roles';
import { OrganizationSelect } from '../components/organization-select';
import { RoleSelectorPanel } from '../components/role-selector-panel';
import { PermissionEditorPanel } from '../components/permission-editor-panel';
import { AccessFormDialog } from '../components/access-form-dialog';
import { Icons } from '@/shared/components/ui/Icons';

const permissionGroups = [
  {
    label: 'Usuarios',
    description: 'Acceso a las cuentas y membresías de la plataforma.',
    permissions: [
      { code: 'users:read', name: 'Ver usuarios', description: 'Consultar el listado y detalle de usuarios.' },
      { code: 'users:create', name: 'Crear usuarios', description: 'Registrar usuarios y sus accesos iniciales.' },
      { code: 'users:update', name: 'Editar usuarios', description: 'Modificar datos y estado de usuarios.' },
    ],
  },
  {
    label: 'Organizaciones',
    description: 'Administración de organizaciones y sus datos principales.',
    permissions: [
      { code: 'organizations:read', name: 'Ver organizaciones', description: 'Consultar organizaciones y su información.' },
      { code: 'organizations:create', name: 'Crear organizaciones', description: 'Dar de alta nuevas organizaciones.' },
      { code: 'organizations:update', name: 'Editar organizaciones', description: 'Actualizar información organizacional.' },
    ],
  },
  {
    label: 'Sucursales',
    description: 'Gestión de sedes y puntos de atención.',
    permissions: [
      { code: 'branches:read', name: 'Ver sucursales', description: 'Consultar sucursales disponibles.' },
      { code: 'branches:create', name: 'Crear sucursales', description: 'Registrar nuevas sucursales.' },
      { code: 'branches:update', name: 'Editar sucursales', description: 'Modificar datos de las sucursales.' },
    ],
  },
  {
    label: 'Roles y permisos',
    description: 'Control sobre roles y configuración de accesos.',
    permissions: [
      { code: 'roles:read', name: 'Ver roles', description: 'Consultar roles y sus permisos.' },
      { code: 'roles:create', name: 'Crear roles', description: 'Crear roles dentro de una organización.' },
      { code: 'roles:update', name: 'Editar roles', description: 'Cambiar la configuración de acceso de un rol.' },
    ],
  },
  {
    label: 'Alcance de usuarios',
    description: 'Define hasta dónde puede consultar usuarios el rol.',
    permissions: [
      { code: 'users:read:organization', name: 'Toda la organización', description: 'Ver usuarios de cualquier sucursal de la organización.' },
      { code: 'users:read:assigned-branches', name: 'Sucursales asignadas', description: 'Ver únicamente usuarios de sucursales asignadas.' },
    ],
  },
] as const;

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

  const query = useRoles(organizationId);
  const roles = query.data ?? [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId);
  const hasChanges = useMemo(
    () => selectedCodes.size !== savedCodes.size || [...selectedCodes].some((code) => !savedCodes.has(code)),
    [savedCodes, selectedCodes],
  );

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
        <OrganizationSelect value={organizationId} onChange={handleOrganizationChange} />
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
            onCreateRole={() => setDialog({ kind: 'role', mode: 'create' })}
          />
          <PermissionEditorPanel
            roleName={selectedRole?.name}
            roleCode={selectedRole?.code}
            readOnly={selectedRole?.organizationId === null}
            groups={permissionGroups}
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

      {organizationId && (
        <button
          type="button"
          onClick={() => setDialog({ kind: 'role', mode: 'create' })}
          className="fixed bottom-20 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-primary px-5 font-display text-sm font-semibold text-primary-foreground shadow-xl transition-transform active:scale-95 lg:hidden"
        >
          <span aria-hidden="true">{Icons.plus}</span>
          Nuevo rol
        </button>
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
