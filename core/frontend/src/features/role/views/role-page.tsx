'use client';

import { useState } from 'react';
import { isAxiosError } from 'axios';
import { useRoles } from '@/features/role/hooks/use-roles';
import { OrganizationSelect } from '../components/organization-select';

export default function RolePage() {
  const [organizationId, setOrganizationId] = useState('');

  const query = useRoles(organizationId);
  const roles = query.data ?? [];

  const error = query.isError
    ? isAxiosError(query.error) &&
      typeof query.error.response?.data?.message === 'string'
      ? query.error.response.data.message
      : 'No se pudo cargar el listado de roles.'
    : null;

  return (
    <section className="p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold text-foreground">
          Roles y permisos
        </h1>

        <p className="text-sm text-muted">
          {roles.length} roles disponibles
        </p>
      </header>

      <div className="mt-6">
        <OrganizationSelect
          value={organizationId}
          onChange={setOrganizationId}
        />
      </div>

      {!organizationId && (
        <p className="mt-4 text-sm text-muted">
          Selecciona una organización para consultar sus roles.
        </p>
      )}

      {organizationId && query.isPending && (
        <p role="status" className="mt-6 text-sm text-muted">
          Cargando roles…
        </p>
      )}

      {organizationId && error && (
        <div
          role="alert"
          className="mt-6 rounded-md border border-danger p-4 text-sm text-danger"
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
        <div className="mt-6 overflow-hidden rounded-md border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-background/50">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Alcance</th>
              </tr>
            </thead>

            <tbody>
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 font-medium">{role.name}</td>
                  <td className="px-4 py-3 font-mono">{role.code}</td>
                  <td className="px-4 py-3 text-muted">
                    {role.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {role.organizationId === null
                      ? 'Global'
                      : 'Organización'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {roles.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">
              No hay roles disponibles.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
