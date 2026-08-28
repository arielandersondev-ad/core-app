'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Icons } from '@/shared/components/ui';
import { organizations, planLabels } from '@/modules/organization/__mocks__/data';

export default function OrganizationList() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = organizations.filter((org) => {
    const q = search.toLowerCase();
    const matchSearch =
      org.name.toLowerCase().includes(q) ||
      org.city.toLowerCase().includes(q) ||
      org.taxId.includes(q);
    const matchFilter = filter === 'all' || org.status === filter;
    return matchSearch && matchFilter;
  });

  const planColors: Record<string, string> = {
    enterprise: 'text-[var(--primary)] bg-[var(--primary-subtle)]',
    professional: 'text-[var(--secondary)] bg-[var(--secondary)]/10',
    starter: 'text-[var(--muted)] bg-[var(--border)]',
  };

  const totalActive = organizations.filter((o) => o.status === 'active').length;
  const totalBranches = organizations.reduce((acc, o) => acc + o.branchesCount, 0);
  const totalUsers = organizations.reduce((acc, o) => acc + o.usersCount, 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Total clientes', value: organizations.length },
          { label: 'Activos', value: totalActive },
          { label: 'Sucursales totales', value: totalBranches },
          { label: 'Usuarios totales', value: totalUsers },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-(--surface) border border-(--border) rounded-md p-3 md:p-4"
          >
            <p className="text-xl md:text-3xl font-display font-bold text-(--foreground)">
              {stat.value}
            </p>
            <p className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-(--muted) mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-(--muted)">
            {Icons.search}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar organización, ciudad o RUC…"
            className="w-full h-9 pl-9 pr-3 bg-(--surface) border border-(--border) rounded-sm text-sm placeholder:text-(--muted) focus:outline-none focus:ring-1 focus:ring-(--ring)"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-9 px-3 rounded-sm text-xs font-mono transition-colors ${
                filter === f
                  ? 'bg-(--primary) text-primary-foreground'
                  : 'bg-(--surface) border border-(--border) text-(--muted) hover:text-(--foreground)'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
        <button
          onClick={() => router.push('/dashboard/organizations/create')}
          className="hidden md:flex h-9 px-4 bg-(--primary) text-primary-foreground rounded-sm text-sm font-display font-semibold items-center gap-1.5 hover:opacity-90 transition-opacity ml-auto"
        >
          {Icons.plus} Nueva organización
        </button>
      </div>

      {/* Listado */}
      <div className="bg-(--surface) border border-(--border) rounded-md overflow-hidden">
        {/* Tabla desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-(--border) bg-background/50">
                {['Organización', 'RUC / NIT', 'Ciudad', 'Plan', 'Sucursales', 'Usuarios', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-(--muted) whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr
                  key={org.id}
                  onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
                  className="border-b border-(--border) last:border-0 hover:bg-background transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xs bg-primary-subtle flex items-center justify-center font-display font-bold text-xs text-(--primary) shrink-0">
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-display font-semibold text-(--foreground)">{org.name}</p>
                        <p className="text-[11px] text-(--muted) font-mono">{org.legalName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[11px] font-mono text-(--muted)">{org.taxId}</td>
                  <td className="px-4 py-3.5 text-sm text-(--muted)">{org.city}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-xs ${planColors[org.plan]}`}
                    >
                      {planLabels[org.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-display font-bold text-(--foreground)">
                    {org.branchesCount}
                  </td>
                  <td className="px-4 py-3.5 text-sm font-display font-bold text-(--foreground)">
                    {org.usersCount}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge variant={org.status === 'active' ? 'active' : 'inactive'}>
                      {org.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3.5 text-(--muted) opacity-0 group-hover:opacity-100 transition-opacity">
                    {Icons.chevronRight}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tarjetas mobile */}
        <div className="md:hidden divide-y divide-(--border)">
          {filtered.map((org) => (
            <div
              key={org.id}
              onClick={() => router.push(`/dashboard/organizations/${org.id}`)}
              className="p-4 cursor-pointer hover:bg-background transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-sm bg-secondary flex items-center justify-center font-display font-bold text-sm text-(--foreground) shrink-0">
                  {org.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-(--foreground) truncate">{org.name}</p>
                  <p className="text-[11px] text-(--muted) truncate">{org.legalName}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant={org.status === 'active' ? 'active' : 'inactive'}>
                      {org.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-xs ${planColors[org.plan]}`}
                    >
                      {planLabels[org.plan]}
                    </span>
                  </div>
                </div>
                <span className="text-(--muted) mt-1 shrink-0">{Icons.chevronRight}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-(--muted)">Sucursales</p>
                  <p className="font-display font-bold text-(--foreground)">{org.branchesCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-(--muted)">Usuarios</p>
                  <p className="font-display font-bold text-(--foreground)">{org.usersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-(--muted)">Ciudad</p>
                  <p className="font-display font-semibold text-(--foreground) truncate">{org.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-(--muted)">Sin resultados</div>
        )}

        <div className="px-4 py-2.5 border-t border-(--border) bg-background/30">
          <p className="text-[11px] font-mono text-(--muted)">
            {filtered.length} de {organizations.length} organizaciones
          </p>
        </div>
      </div>

      {/* FAB (solo móvil) */}
      <button
        onClick={() => router.push('/dashboard/organizations/create')}
        className="md:hidden fixed bottom-20 right-4 w-12 h-12 bg-(--primary) text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:opacity-80 z-10"
      >
        {Icons.plus}
      </button>
    </div>
  );
}