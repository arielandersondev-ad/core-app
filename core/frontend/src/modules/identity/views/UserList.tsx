'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Badge,
  Icons,
} from '@/shared/components/ui';
import {
  users,
  organizations,
  roleLabels,
  timeAgo,
} from '@/modules/organization/__mocks__/data';

type StatusFilter = 'all' | 'active' | 'inactive' | 'suspended';

export default function UserList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [orgFilter, setOrgFilter] = useState('all');

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchOrg = orgFilter === 'all' || u.orgId === orgFilter;
    return matchSearch && matchStatus && matchOrg;
  });

  const statusCounts = {
    active: users.filter((u) => u.status === 'active').length,
    inactive: users.filter((u) => u.status === 'inactive').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
  };

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
    { value: 'suspended', label: 'Suspendidos' },
  ];

  return (
    <div className="flex flex-col h-full p-4 md:p-8 gap-6">
      {/* ── Stats (solo desktop) ── */}
      <div className="hidden md:grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: users.length, filter: 'all' as const },
          { label: 'Activos', value: statusCounts.active, filter: 'active' as const },
          { label: 'Inactivos', value: statusCounts.inactive, filter: 'inactive' as const },
          { label: 'Suspendidos', value: statusCounts.suspended, filter: 'suspended' as const },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.filter)}
            className={`p-4 rounded-sm border text-left transition-colors ${
              statusFilter === s.filter
                ? 'border-primary bg-primary-subtle'
                : 'border-border bg-surface hover:border-primary/40'
            }`}
          >
            <p
              className="text-3xl font-display font-bold"
              style={{ color: statusFilter === s.filter ? 'var(--primary)' : 'var(--foreground)' }}
            >
              {s.value}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted mt-1">
              {s.label}
            </p>
          </button>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {Icons.search}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario o correo…"
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded-sm text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`h-7 px-3 rounded-sm text-xs font-mono transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={orgFilter}
            onChange={(e) => setOrgFilter(e.target.value)}
            className="h-7 px-2 rounded-sm text-xs font-mono bg-surface border border-border text-muted focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Todas las organizaciones</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => router.push('/dashboard/users/create')}
          className="hidden md:flex h-9 px-4 bg-primary text-primary-foreground rounded-sm text-sm font-display font-semibold items-center gap-1.5 hover:opacity-90 transition-opacity ml-auto"
        >
          {Icons.plus} Nuevo usuario
        </button>
      </div>

      {/* ── Listado ── */}
      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {/* Tabla desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-background/50">
                {['Usuario', 'Organización', 'Sucursal', 'Rol', 'Estado', 'Último acceso', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const org = organizations.find((o) => o.id === user.orgId);
                return (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/dashboard/users/${user.id}`)}
                    className="border-b border-border last:border-0 hover:bg-background transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="text-sm font-display font-semibold text-foreground">{user.name}</p>
                          <p className="text-[11px] font-mono text-muted">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted">{org?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted">
                      {user.branchId ? 'Asignada' : <span className="text-muted/50">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-mono uppercase tracking-wide text-muted whitespace-nowrap">
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive'}>
                        {user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Suspendido' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-muted whitespace-nowrap">
                      {timeAgo(user.lastLogin)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        {Icons.chevronRight}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tarjetas mobile */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((user) => {
            const org = organizations.find((o) => o.id === user.orgId);
            return (
              <button
                key={user.id}
                onClick={() => router.push(`/dashboard/users/${user.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-background transition-colors text-left"
              >
                <Avatar name={user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-display font-semibold text-foreground truncate">
                      {user.name}
                    </p>
                    <Badge variant={user.status === 'active' ? 'active' : user.status === 'suspended' ? 'suspended' : 'inactive'}>
                      {user.status === 'active' ? 'Activo' : user.status === 'suspended' ? 'Susp.' : 'Inac.'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {roleLabels[user.role]}
                    </span>
                    <span className="text-border">·</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {org?.name}
                    </span>
                  </div>
                </div>
                <span className="text-muted-foreground shrink-0">{Icons.chevronRight}</span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-muted">Sin resultados</div>
        )}

        <div className="px-4 py-2.5 border-t border-border bg-background/30">
          <p className="text-[11px] font-mono text-muted">
            {filtered.length} de {users.length} usuarios
          </p>
        </div>
      </div>

      {/* ── FAB (solo móvil) ── */}
      <button
        onClick={() => router.push('/dashboard/users/create')}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:opacity-80 z-10"
      >
        {Icons.plus}
      </button>
    </div>
  );
}