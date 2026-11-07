'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Avatar,
  Badge,
  Card,
  Separator,
  Icons,
  SectionHeader,
  Toggle,
} from '@/shared/components/ui';
import { useUsers } from '@/features/user/hooks/use-users';
import { useOrganizations } from '@/features/organization/hooks/use-organizations';
import {
  roleLabels,
  formatDate,
  timeAgo,
  MODULES,
  type Permission,
} from '@/shared/utils/format';

type Tab = 'info' | 'permisos';

function ActionRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-4 active:bg-muted text-left"
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <span className="text-muted-foreground shrink-0">{Icons.chevronRight}</span>
    </button>
  );
}

export default function UserDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;

  const { data: rawUsers = [], isLoading: loadingUsers } = useUsers();
  const { data: rawOrgs = [] } = useOrganizations();

  const rawUser = useMemo(() => rawUsers.find((u) => u.id === userId), [rawUsers, userId]);

  const user = useMemo(() => {
    if (!rawUser) return null;
    const primaryMembership = rawUser.memberships?.[0];
    return {
      id: rawUser.id,
      name: `${rawUser.firstName || ''} ${rawUser.lastName || ''}`.trim() || rawUser.email,
      email: rawUser.email,
      role: (primaryMembership?.roleNames?.[0] || 'operator').toLowerCase(),
      orgId: primaryMembership?.organizationId,
      branchName: primaryMembership?.branchNames?.[0] || 'Sin asignar',
      status: rawUser.status.toLowerCase() === 'active' ? 'active' : 'inactive',
      lastLogin: rawUser.createdAt,
      createdAt: rawUser.createdAt,
    };
  }, [rawUser]);

  const org = useMemo(() => {
    if (!user?.orgId) return null;
    return rawOrgs.find((o) => o.id === user.orgId);
  }, [rawOrgs, user]);

  const [tab, setTab] = useState<Tab>('info');
  const [permissions, setPermissions] = useState<Permission[]>(() =>
    MODULES.map((m) => ({ module: m, view: false, create: false, edit: false, delete: false }))
  );
  const [permSaved, setPermSaved] = useState(false);

  if (loadingUsers) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm font-mono text-muted-foreground">Cargando usuario...</p>
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

  const statusVariant = user.status === 'active' ? 'active' : 'inactive';
  const statusLabel = user.status === 'active' ? 'Activo' : 'Inactivo';

  const updatePerm = (module: string, action: keyof Omit<Permission, 'module'>, value: boolean) => {
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
    setPermSaved(false);
  };

  const actions: { key: keyof Omit<Permission, 'module'>; label: string }[] = [
    { key: 'view', label: 'Ver' },
    { key: 'create', label: 'Crear' },
    { key: 'edit', label: 'Editar' },
    { key: 'delete', label: 'Eliminar' },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6">
      {/* Profile header */}
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <Avatar name={user.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground truncate">
              {user.name}
            </h2>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <Badge variant="role">{roleLabels[user.role] || user.role}</Badge>
          </div>
          <p className="text-sm font-mono text-muted">{user.email}</p>
          <p className="text-[11px] font-mono text-muted mt-1">
            {org?.name || 'Organización'}
            {user.branchName ? ` · ${user.branchName}` : ''} · Registrado {formatDate(user.createdAt)}
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-center">
          {user.status === 'active' ? (
            <button className="h-9 px-4 border border-danger text-danger rounded-sm text-sm font-display font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              Suspender
            </button>
          ) : (
            <button className="h-9 px-4 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-sm text-sm font-display font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
              Reactivar
            </button>
          )}
        </div>
      </div>

      {/* Tabs (solo desktop) */}
      <div className="hidden md:flex gap-0 border-b border-border">
        {(
          [
            { key: 'info', label: 'Información' },
            { key: 'permisos', label: 'Permisos' },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-display font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna izquierda (2/3 en desktop): Información detallada + secciones */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
                {[
                  { label: 'Organización', value: org?.name ?? '—' },
                  { label: 'Sucursal', value: user.branchName },
                  { label: 'Rol', value: roleLabels[user.role] || user.role },
                  { label: 'Estado', value: user.status },
                  { label: 'Último acceso', value: timeAgo(user.lastLogin) },
                  { label: 'Fecha de registro', value: formatDate(user.createdAt) },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={`px-5 py-4 ${
                      i % 2 === 0 && i < 5 ? 'md:border-r border-border' : ''
                    } ${i < 4 ? 'border-b border-border' : ''} ${
                      i >= 2 && i < 4 ? 'md:border-b border-border' : ''
                    }`}
                  >
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-display font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Acciones de cuenta (mobile) */}
            <div className="md:hidden">
              <SectionHeader>Gestión de cuenta</SectionHeader>
              <Card className="overflow-hidden">
                <ActionRow
                  icon={Icons.mail}
                  label="Cambiar correo electrónico"
                  description={user.email}
                  onClick={() => router.push(`/users/${userId}/change-email`)}
                />
                <Separator />
                <ActionRow
                  icon={Icons.lock}
                  label="Cambiar contraseña"
                  description="Restablecer credenciales"
                  onClick={() => router.push(`/users/${userId}/change-password`)}
                />
                <Separator />
                <ActionRow
                  icon={Icons.shield}
                  label="Permisos del usuario"
                  description="Módulos y acciones autorizadas"
                  onClick={() => router.push(`/users/${userId}/permissions`)}
                />
              </Card>
            </div>

            {/* Zona de riesgo (mobile) */}
            <div className="md:hidden">
              <SectionHeader>Zona de riesgo</SectionHeader>
              <Card className="overflow-hidden">
                {user.status === 'active' ? (
                  <button className="w-full flex items-center gap-3 px-4 py-4 active:opacity-70 text-left">
                    <span className="text-danger">{Icons.alertTriangle}</span>
                    <div>
                      <p className="text-sm font-display font-semibold text-danger">Suspender cuenta</p>
                      <p className="text-[11px] text-muted-foreground">
                        El usuario pierde acceso inmediatamente
                      </p>
                    </div>
                  </button>
                ) : (
                  <button className="w-full flex items-center gap-3 px-4 py-4 active:opacity-70 text-left">
                    <span className="text-emerald-600">{Icons.check}</span>
                    <div>
                      <p className="text-sm font-display font-semibold text-emerald-700 dark:text-emerald-400">
                        Reactivar cuenta
                      </p>
                      <p className="text-[11px] text-muted-foreground">Restaurar acceso al sistema</p>
                    </div>
                  </button>
                )}
                <Separator />
                <button className="w-full flex items-center gap-3 px-4 py-4 active:opacity-70 text-left">
                  <span className="text-danger">{Icons.alertTriangle}</span>
                  <div>
                    <p className="text-sm font-display font-semibold text-danger">Eliminar usuario</p>
                    <p className="text-[11px] text-muted-foreground">Esta acción no se puede deshacer</p>
                  </div>
                </button>
              </Card>
            </div>
          </div>

          {/* Columna derecha (1/3 en desktop): Acciones de cuenta */}
          <div className="hidden md:flex flex-col gap-4">
            <Card className="p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
                Gestión de cuenta
              </p>
              <ActionRow
                icon={Icons.mail}
                label="Cambiar correo"
                description={user.email}
                onClick={() => router.push(`/users/${userId}/change-email`)}
              />
              <Separator />
              <ActionRow
                icon={Icons.lock}
                label="Cambiar contraseña"
                description="Restablecer credenciales"
                onClick={() => router.push(`/users/${userId}/change-password`)}
              />
            </Card>

            <Card className="p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-danger mb-3">
                Zona de riesgo
              </p>
              <div className="flex flex-col gap-2">
                {user.status === 'active' ? (
                  <button className="w-full h-9 px-4 border border-danger text-danger rounded-sm text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                    Suspender
                  </button>
                ) : (
                  <button className="w-full h-9 px-4 border border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-sm text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                    Reactivar
                  </button>
                )}
                <button className="w-full h-9 px-4 border border-border text-muted rounded-sm text-sm font-semibold hover:border-danger hover:text-danger transition-colors">
                  Eliminar usuario
                </button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'permisos' && (
        <div>
          {/* Vista móvil de permisos (< 768px) */}
          <div className="grid gap-3 md:hidden">
            {permissions.map((perm) => {
              const allOn = perm.view && perm.create && perm.edit && perm.delete;
              return (
                <Card key={perm.module} className="overflow-hidden p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <h3 className="text-sm font-display font-semibold text-foreground">
                      {perm.module}
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setPermissions((prev) =>
                          prev.map((p) =>
                            p.module === perm.module
                              ? {
                                  module: p.module,
                                  view: !allOn,
                                  create: !allOn,
                                  edit: !allOn,
                                  delete: !allOn,
                                }
                              : p
                          )
                        );
                        setPermSaved(false);
                      }}
                      className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-primary transition-colors"
                    >
                      {allOn ? 'Revocar todo' : 'Dar todo'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    {actions.map((a) => (
                      <div key={a.key} className="flex items-center justify-between rounded-md bg-background/50 p-2 border border-border/50">
                        <span className="text-xs text-muted font-medium">{a.label}</span>
                        <Toggle
                          checked={perm[a.key]}
                          onChange={(v) => updatePerm(perm.module, a.key, v)}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Vista desktop de tabla tradicional (>= 768px) */}
          <div className="hidden md:block">
            <Card className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="text-left px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-muted">
                      Módulo
                    </th>
                    {actions.map((a) => (
                      <th
                        key={a.key}
                        className="text-center px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted w-24"
                      >
                        {a.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 w-28" />
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((perm, i) => (
                    <tr
                      key={perm.module}
                      className={`border-b border-border last:border-0 ${
                        i % 2 === 0 ? '' : 'bg-background/20'
                      }`}
                    >
                      <td className="px-5 py-3 text-sm font-display font-semibold text-foreground">
                        {perm.module}
                      </td>
                      {actions.map((a) => (
                        <td key={a.key} className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <Toggle
                              checked={perm[a.key]}
                              onChange={(v) => updatePerm(perm.module, a.key, v)}
                            />
                          </div>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            const allOn = perm.view && perm.create && perm.edit && perm.delete;
                            setPermissions((prev) =>
                              prev.map((p) =>
                                p.module === perm.module
                                  ? {
                                      module: p.module,
                                      view: !allOn,
                                      create: !allOn,
                                      edit: !allOn,
                                      delete: !allOn,
                                    }
                                  : p
                              )
                            );
                            setPermSaved(false);
                          }}
                          className="text-[10px] font-mono uppercase tracking-wider text-muted hover:text-primary transition-colors"
                        >
                          {perm.view && perm.create && perm.edit && perm.delete
                            ? 'Revocar todo'
                            : 'Dar todo'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => setPermSaved(true)}
              className="h-9 px-5 bg-primary text-primary-foreground rounded-sm text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Guardar permisos
            </button>
            {permSaved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                ✓ Cambios guardados
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
