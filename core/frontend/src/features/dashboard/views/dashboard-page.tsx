'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateOrganizationDialog } from '@/features/organization/components/create-organization-dialog';
import { useBranchesByOrganizations, useOrganizations } from '@/features/organization/hooks/use-organizations';
import { CreateUserDialog } from '@/features/user/components/create-user-dialog';
import { useUsers } from '@/features/user/hooks/use-users';
import { StatCard, Card, Avatar, Badge, Icons, Separator } from '@/shared/components/ui';

function timeAgo(iso: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(iso).getTime());
  const hours = Math.floor(elapsed / 3_600_000);

  if (hours < 1) return 'hace menos de 1h';
  if (hours < 24) return `hace ${hours}h`;

  return `hace ${Math.floor(hours / 24)}d`;
}

export default function Dashboard() {
  const router = useRouter();
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateOrganizationOpen, setIsCreateOrganizationOpen] = useState(false);
  const organizationsQuery = useOrganizations();
  const usersQuery = useUsers();
  const organizations = organizationsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const organizationIds = organizations.map((organization) => organization.id);
  const branchQueries = useBranchesByOrganizations(organizationIds);
  const branchCountByOrganization = new Map(
    organizationIds.map((organizationId, index) => [
      organizationId,
      branchQueries[index]?.data?.length ?? 0,
    ]),
  );
  const userCountByOrganization = new Map<string, number>();

  for (const user of users) {
    for (const membership of user.memberships) {
      userCountByOrganization.set(
        membership.organizationId,
        (userCountByOrganization.get(membership.organizationId) ?? 0) + 1,
      );
    }
  }

  const recentUsers = [...users]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  const activeOrganizations = organizations.filter(
    (organization) => organization.status.toUpperCase() === 'ACTIVE',
  );
  const activeBranches = branchQueries.reduce(
    (total, query) => total + (query.data?.filter((branch) => branch.status.toUpperCase() === 'ACTIVE').length ?? 0),
    0,
  );
  const activeUsers = users.filter((user) => user.status.toUpperCase() === 'ACTIVE').length;
  const memberships = users.reduce((total, user) => total + user.memberships.length, 0);
  const isPending = organizationsQuery.isPending || usersQuery.isPending || branchQueries.some((query) => query.isPending);
  const hasError = organizationsQuery.isError || usersQuery.isError || branchQueries.some((query) => query.isError);

  function retryQueries() {
    void organizationsQuery.refetch();
    void usersQuery.refetch();
    branchQueries.forEach((query) => void query.refetch());
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6">
      {/* Hero strip */}
      <div>
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">
          Panel de Control
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Bienvenido
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sistema multicliente · {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        <StatCard label="Usuarios" value={activeUsers} icon={Icons.users} />
        <StatCard label="Clientes" value={activeOrganizations.length} icon={Icons.building} />
        <StatCard label="Sucursales" value={activeBranches} icon={Icons.branch} />
        <div className="hidden md:block">
          <StatCard label="Membresías" value={memberships} icon={Icons.clock} />
        </div>
      </div>

      {isPending && <p role="status" className="text-sm text-muted">Actualizando resumen…</p>}
      {hasError && (
        <div role="alert" className="rounded-md border border-danger p-4 text-sm text-danger">
          No se pudo cargar todo el resumen.
          <button type="button" onClick={retryQueries} className="ml-2 underline">Reintentar</button>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-3">
          <button
            type="button"
            onClick={() => setIsCreateUserOpen(true)}
            className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-(--radius) active:opacity-70 text-left"
          >
            <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              {Icons.users}
            </span>
            <div>
              <p className="text-xs font-display font-semibold text-foreground">Nuevo usuario</p>
              <p className="text-[10px] text-muted-foreground">Crear cuenta</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOrganizationOpen(true)}
            className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-(--radius) active:opacity-70 text-left"
          >
            <span className="w-8 h-8 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
              {Icons.building}
            </span>
            <div>
              <p className="text-xs font-display font-semibold text-foreground">Nueva org.</p>
              <p className="text-[10px] text-muted-foreground">Registrar cliente</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Usuarios recientes
        </p>
        <Card className="overflow-hidden">
          {!isPending && recentUsers.length === 0 && (
            <p className="p-6 text-center text-sm text-muted">No hay usuarios registrados.</p>
          )}
          {recentUsers.map((user, i) => {
            const name = `${user.firstName} ${user.lastName}`;
            const organizationNames = user.memberships
              .map((membership) => membership.organizationName)
              .join(', ');
            return (
              <div key={user.id}>
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted text-left"
                >
                  <Avatar name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">
                      {name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{organizationNames || 'Sin organización'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={user.status === 'ACTIVE' ? 'active' : user.status === 'SUSPENDED' ? 'suspended' : 'inactive'}>
                      {user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                    </Badge>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                      {Icons.clock} {timeAgo(user.createdAt)}
                    </p>
                  </div>
                </button>
                {i < recentUsers.length - 1 && <Separator />}
              </div>
            );
          })}
        </Card>
      </div>

      {/* Organizations summary */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Clientes activos
        </p>
        <div className="flex flex-col gap-2">
          {!isPending && activeOrganizations.length === 0 && (
            <p className="rounded-md border border-border bg-surface p-6 text-center text-sm text-muted">
              No hay organizaciones activas.
            </p>
          )}
          {activeOrganizations
            .slice(0, 4)
            .map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() => router.push('/organizations')}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-(--radius) active:opacity-70 text-left"
              >
                <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center font-display font-bold text-sm text-foreground">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground truncate">{org.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {userCountByOrganization.get(org.id) ?? 0} usuarios · {branchCountByOrganization.get(org.id) ?? 0} sucursales
                  </p>
                </div>
                <span className="text-muted-foreground">{Icons.chevronRight}</span>
              </button>
            ))}
        </div>
      </div>

      <CreateUserDialog
        open={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
      />
      <CreateOrganizationDialog
        open={isCreateOrganizationOpen}
        onClose={() => setIsCreateOrganizationOpen(false)}
      />
    </div>
  );
}
