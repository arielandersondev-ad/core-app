'use client';
// componente a remplazar por mejores versiones
import { useOrganizations } from '@/features/organization/hooks/use-organizations';

type OrganizationSelectProps = {
  value: string;
  onChange: (organizationId: string) => void;
};

export function OrganizationSelect({value, onChange}: OrganizationSelectProps) {
  const query = useOrganizations();
  const organizations = query.data ?? [];

  return (
    <label className="block">
      <span className="text-sm text-muted">Organización</span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={query.isPending || query.isError}
        className="mt-2 h-10 min-w-64 rounded-md border border-border bg-surface px-3 text-sm"
      >
        <option value="">
          {query.isPending
            ? 'Cargando organizaciones…'
            : query.isError
              ? 'No se pudieron cargar'
              : 'Selecciona una organización'}
        </option>

        {organizations.map((organization) => (
          <option key={organization.id} value={organization.id}>
            {organization.name}
          </option>
        ))}
      </select>
    </label>
  );
}