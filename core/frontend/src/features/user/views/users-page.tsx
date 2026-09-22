'use client';

import { useState } from 'react';
import { Avatar, Badge, Icons } from '@/shared/components/ui';
import { useUsers } from '@/features/user/hooks/use-users';
import { isAxiosError } from 'axios';

export default function UserList() {
  const query = useUsers();
  const users = query.data ?? [];
  const error = query.isError
    ? (isAxiosError(query.error) && typeof query.error.response?.data?.message === 'string'
      ? query.error.response.data.message
      : 'No se pudo cargar el listado de usuarios.')
    : null;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [organizationId, setOrganizationId] = useState('all');
  const organizations = Array.from(new Map(
    users.flatMap((user) => user.memberships.map((membership) => [membership.organizationId, membership.organizationName] as const)),
  ));
  const filtered = users.filter((user) => {
    const query = search.trim().toLocaleLowerCase();
    return (!query || `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase().includes(query))
      && (status === 'all' || user.status.toUpperCase() === status)
      && (organizationId === 'all' || user.memberships.some((membership) => membership.organizationId === organizationId));
  });

  return (
    <div className="flex h-full flex-col gap-5 p-4 md:p-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-sm text-muted">{users.length} usuarios registrados</p>
      </div>
      {query.isPending && <p role="status" className="text-sm text-muted">Cargando usuarios…</p>}
      {error && <div role="alert" className="rounded-md border border-danger p-4 text-sm text-danger">{error} <button type="button" onClick={() => void query.refetch()} className="ml-2 underline">Reintentar</button></div>}
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{Icons.search}</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario o correo…" className="h-9 w-full rounded-sm border border-border bg-surface pl-9 pr-3 text-sm" />
        </div>
        <select aria-label="Estado" value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-sm border border-border bg-surface px-2 text-sm">
          <option value="all">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>
        <select aria-label="Organización" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="h-9 rounded-sm border border-border bg-surface px-2 text-sm">
          <option value="all">Todas las organizaciones</option>
          {organizations.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto rounded-md border border-border bg-surface">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted">
            <tr>{['Usuario', 'Organización', 'Sucursales', 'Roles', 'Estado'].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((user) => <tr key={user.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={`${user.firstName} ${user.lastName}`} size="sm" /><div><p className="font-semibold text-foreground">{user.firstName} {user.lastName}</p><p className="text-xs text-muted">{user.email}</p></div></div></td>
              <td className="px-4 py-3 text-muted">{user.memberships.map((item) => item.organizationName).join(', ') || '—'}</td>
              <td className="px-4 py-3 text-muted">{user.memberships.flatMap((item) => item.branchNames).join(', ') || '—'}</td>
              <td className="px-4 py-3 text-muted">{user.memberships.flatMap((item) => item.roleNames).join(', ') || '—'}</td>
              <td className="px-4 py-3"><Badge variant={user.status === 'ACTIVE' ? 'active' : user.status === 'SUSPENDED' ? 'suspended' : 'inactive'}>{user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}</Badge></td>
            </tr>)}
          </tbody>
        </table>
        {!error && !query.isPending && filtered.length === 0 && <p className="p-8 text-center text-sm text-muted">Sin resultados</p>}
        <p className="border-t border-border px-4 py-2 text-xs text-muted">{filtered.length} de {users.length} usuarios</p>
      </div>
    </div>
  );
}
