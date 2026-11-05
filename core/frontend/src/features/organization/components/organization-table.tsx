import Link from 'next/link';
import type { OrganizationListItem } from '../types/organization-list';
import { getOrganizationInitials } from '../utils/get-organization-initial';
import { OrganizationStatusBadge } from './organization-status-badge';

type Props = { organizations: readonly OrganizationListItem[]; total: number };

export function OrganizationTable({ organizations, total }: Props) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <caption className="sr-only">Organizaciones registradas en la plataforma</caption>
          <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted">
            <tr>
              {['Organización', 'NIT', 'País', 'Estado', 'Acciones'].map((heading) => (
                <th
                  key={heading}
                  scope="col"
                  className={`px-5 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted ${
                    heading === 'Acciones' ? 'text-right' : ''
                  }`}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map((organization) => (
              <tr key={organization.id} className="hover:bg-background/40 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-xs font-bold text-primary">
                      {getOrganizationInitials(organization.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{organization.name}</p>
                      <p className="mt-0.5 text-xs text-muted">{organization.legalName || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted">{organization.taxId || '—'}</td>
                <td className="px-5 py-3.5 text-xs text-foreground">{organization.country}</td>
                <td className="px-5 py-3.5">
                  <OrganizationStatusBadge status={organization.status} />
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <Link
                    href={`/organizations/${organization.id}`}
                    className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background transition-colors"
                  >
                    Detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-border px-5 py-3 font-mono text-xs text-muted">
        Mostrando {organizations.length} de {total} organizaciones
      </footer>
    </div>
  );
}
