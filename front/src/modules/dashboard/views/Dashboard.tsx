'use client';

import { useRouter } from 'next/navigation';
import { organizations, users, branches, timeAgo, roleLabels } from '@/modules/organization/__mocks__/data';
import { StatCard, Card, Avatar, Badge, Icons, Separator } from '@/shared/components/ui';

const recentUsers = [...users]
  .sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime())
  .slice(0, 4);

const activeOrgs = organizations.filter((o) => o.status === 'active').length;
const activeBranches = branches.filter((b) => b.status === 'active').length;
const activeUsers = users.filter((u) => u.status === 'active').length;

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6">
      {/* Hero strip */}
      <div>
        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest mb-0.5">
          Panel de Control
        </p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          Buenos días, Admin
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sistema multicliente · {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
        <StatCard label="Usuarios" value={activeUsers} icon={Icons.users} />
        <StatCard label="Clientes" value={activeOrgs} icon={Icons.building} />
        <StatCard label="Sucursales" value={activeBranches} icon={Icons.branch} />
        <div className="hidden md:block">
          <StatCard label="Ingresos del día" value="—" icon={Icons.clock} />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 gap-2 md:flex md:gap-3">
          <button
            onClick={() => router.push('/dashboard/users/create')}
            className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-[var(--radius)] active:opacity-70 text-left"
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
            onClick={() => router.push('/dashboard/organizations/create')}
            className="flex items-center gap-2.5 p-3 bg-card border border-border rounded-[var(--radius)] active:opacity-70 text-left"
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
          Actividad reciente
        </p>
        <Card className="overflow-hidden">
          {recentUsers.map((user, i) => {
            const org = organizations.find((o) => o.id === user.orgId);
            return (
              <div key={user.id}>
                <button
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted text-left"
                >
                  <Avatar name={user.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{org?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive'}>
                      {user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                    </Badge>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                      {Icons.clock} {timeAgo(user.lastLogin)}
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
          {organizations
            .filter((o) => o.status === 'active')
            .map((org) => (
              <button
                key={org.id}
                onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
                className="flex items-center gap-3 p-3 bg-card border border-border rounded-[var(--radius)] active:opacity-70 text-left"
              >
                <div className="w-9 h-9 rounded-sm bg-secondary flex items-center justify-center font-display font-bold text-sm text-foreground">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-semibold text-foreground truncate">{org.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {org.usersCount} usuarios · {org.branchesCount} sucursales
                  </p>
                </div>
                <span className="text-muted-foreground">{Icons.chevronRight}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}