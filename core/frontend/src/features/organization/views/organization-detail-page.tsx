'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Avatar, Separator, Icons } from '@/shared/components/ui';
import { useOrganizations, useBranches } from '../hooks/use-organizations';
import { useUsers } from '@/features/user/hooks/use-users';
import { formatDate, planLabels } from '@/shared/utils/format';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="px-4 py-3 md:px-0 md:py-2">
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5 break-all">{value || '-'}</p>
    </div>
  );
}

export default function OrganizationDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const orgId = params.id;

  const { data: orgs = [], isLoading: loadingOrgs } = useOrganizations();
  const { data: rawBranches = [], isLoading: loadingBranches } = useBranches(orgId);
  const { data: rawUsers = [] } = useUsers();

  const org = useMemo(() => orgs.find((o) => o.id === orgId), [orgs, orgId]);

  const branches = useMemo(() => {
    return rawBranches.map((b) => ({
      id: b.id,
      name: b.name,
      city: (b as unknown as { city?: string }).city || 'Principal',
      address: (b as unknown as { address?: string }).address || 'Dirección central',
      manager: (b as unknown as { manager?: string }).manager || 'Sin asignar',
      usersCount: (b as unknown as { usersCount?: number }).usersCount || 0,
      status: b.status.toLowerCase() === 'active' ? 'active' : 'inactive',
    }));
  }, [rawBranches]);

  const orgUsers = useMemo(() => {
    return rawUsers
      .filter((u) => u.memberships?.some((m) => m.organizationId === orgId))
      .map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        status: u.status.toLowerCase() === 'active' ? 'active' : 'inactive',
      }));
  }, [rawUsers, orgId]);

  const activeBranches = useMemo(
    () => branches.filter((b) => b.status === 'active'),
    [branches]
  );

  const plan = 'enterprise';
  const planColors: Record<string, string> = {
    enterprise: 'text-primary bg-primary-subtle',
    professional: 'text-secondary bg-secondary/10',
    starter: 'text-muted bg-border',
  };

  if (loadingOrgs || loadingBranches) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-sm font-mono text-muted-foreground">Cargando organización...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted-foreground">Organización no encontrada</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 md:p-8 gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-5">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-sm bg-primary-subtle flex items-center justify-center font-display font-bold text-xl text-primary shrink-0">
          {org.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">{org.name}</h2>
            <Badge variant={org.status.toLowerCase() === 'active' ? 'active' : 'inactive'}>
              {org.status.toLowerCase() === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
            <span
              className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-xs ${planColors[plan]}`}
            >
              {planLabels[plan]}
            </span>
          </div>
          <p className="text-sm text-muted font-mono">
            {org.legalName || org.name} {org.taxId ? `· ${org.taxId}` : ''}
          </p>
        </div>
        <button
          onClick={() => router.push(`/organizations/${orgId}/branches/create`)}
          className="h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-display font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity self-start md:self-center"
        >
          {Icons.plus} Nueva sucursal
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[
          { label: 'Sucursales', value: branches.length },
          { label: 'Usuarios', value: orgUsers.length },
          { label: 'Sucursales activas', value: activeBranches.length },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface border border-border rounded-md p-3 md:p-4"
          >
            <p className="text-xl md:text-3xl font-display font-bold text-foreground">
              {stat.value}
            </p>
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-muted mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Contenido: 2 columnas en desktop, 1 en mobile ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna izquierda (2/3 en desktop): Sucursales + Usuarios */}
        <div className="md:col-span-2 flex flex-col gap-5">
          {/* Sucursales */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">Sucursales</p>
              <button
                onClick={() => router.push(`/organizations/${orgId}/branches/create`)}
                className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
              >
                {Icons.plus} Nueva
              </button>
            </div>

            {/* Tabla desktop */}
            <div className="hidden md:block bg-surface border border-border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    {['Nombre', 'Ciudad', 'Encargado', 'Usuarios', 'Estado', ''].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {branches.map((branch) => (
                    <tr
                      key={branch.id}
                      onClick={() => router.push(`/organizations/${orgId}/branches/${branch.id}`)}
                      className="border-b border-border last:border-0 hover:bg-background transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-display font-semibold text-foreground">{branch.name}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">{branch.city}</td>
                      <td className="px-4 py-3 text-sm text-muted">{branch.manager}</td>
                      <td className="px-4 py-3 text-sm font-display font-bold text-foreground">
                        {branch.usersCount}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={branch.status === 'active' ? 'active' : 'inactive'}>
                          {branch.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {Icons.chevronRight}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {branches.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">No hay sucursales</div>
              )}
            </div>

            {/* Tarjetas mobile */}
            <div className="md:hidden flex flex-col gap-2">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => router.push(`/organizations/${orgId}/branches/${branch.id}`)}
                  className="w-full text-left bg-surface border border-border rounded-md active:opacity-70"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <span className="text-muted-foreground shrink-0">{Icons.mapPin}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        {branch.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {branch.address}, {branch.city}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={branch.status === 'active' ? 'active' : 'inactive'}>
                          {branch.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {branch.usersCount} usuarios
                        </span>
                      </div>
                    </div>
                    <span className="text-muted-foreground shrink-0">{Icons.chevronRight}</span>
                  </div>
                </button>
              ))}
              {branches.length === 0 && (
                <div className="py-8 text-center text-sm text-muted">No hay sucursales</div>
              )}
            </div>
          </div>

          {/* Usuarios */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted">
                Usuarios ({orgUsers.length})
              </p>
              <button
                onClick={() => router.push('/users/create')}
                className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
              >
                {Icons.plus} Agregar
              </button>
            </div>
            <div className="bg-surface border border-border rounded-md overflow-hidden">
              {orgUsers.slice(0, 5).map((user, i) => (
                <div key={user.id}>
                  <button
                    onClick={() => router.push(`/users/${user.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
                  >
                    <Avatar name={user.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] font-mono text-muted truncate">{user.email}</p>
                    </div>
                    <Badge variant={user.status === 'active' ? 'active' : 'inactive'}>
                      {user.status === 'active' ? 'Activo' : 'Inac.'}
                    </Badge>
                  </button>
                  {i < Math.min(orgUsers.length, 5) - 1 && <Separator />}
                </div>
              ))}
              {orgUsers.length > 5 && (
                <>
                  <Separator />
                  <div className="px-4 py-3 text-center">
                    <p className="text-xs text-muted-foreground font-mono">
                      +{orgUsers.length - 5} más
                    </p>
                  </div>
                </>
              )}
              {orgUsers.length === 0 && (
                <div className="py-4 text-center text-sm text-muted">No hay usuarios</div>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha (1/3 en desktop): Información fiscal + Plan */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-md p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-4">
              Datos fiscales
            </p>
            <div className="flex flex-col gap-3">
              <InfoRow label="Razón social" value={org.legalName || org.name} />
              <Separator />
              <InfoRow label="RUC / NIT" value={org.taxId || 'No registrado'} />
              <Separator />
              <InfoRow label="País" value={org.country || 'No especificado'} />
              <Separator />
              <InfoRow label="Registrado" value={formatDate(org.createdAt)} />
            </div>
          </div>

          <div className="bg-surface border border-border rounded-md p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mb-3">
              Plan actual
            </p>
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-mono font-medium uppercase tracking-wider rounded-xs ${planColors[plan]}`}
            >
              {planLabels[plan]}
            </span>
            <button className="mt-3 w-full h-8 text-xs font-semibold text-primary border border-primary/30 rounded-sm hover:bg-primary-subtle transition-colors">
              Cambiar plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
