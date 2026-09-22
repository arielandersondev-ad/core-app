import type { OrganizationListItem } from '../types/organization-list';
import { getOrganizationInitials } from '../utils/get-organization-initial';
import { OrganizationStatusBadge } from './organization-badges';

type Props = { organizations: readonly OrganizationListItem[]; total: number };

export function OrganizationTable({ organizations, total }: Props) {
  return (
    <div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <caption className="sr-only">Organizaciones registradas en la plataforma</caption>
          <thead className="bg-background/60">
            <tr className="border-b border-border">
              {['Organización', 'NIT', 'País', 'Estado'].map((heading) => (
                <th key={heading} scope="col" className="px-5 py-4 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map((organization) => (
              <tr key={organization.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-xs font-bold text-primary">{getOrganizationInitials(organization.name)}</div>
                    <div><p className="font-semibold text-foreground">{organization.name}</p><p className="mt-0.5 text-xs text-muted">{organization.legalName || '—'}</p></div>
                  </div>
                </td>
                <td className="px-5 py-4 font-mono text-sm text-muted">{organization.taxId || '—'}</td>
                <td className="px-5 py-4 text-sm text-foreground">{organization.country}</td>
                <td className="px-5 py-4"><OrganizationStatusBadge status={organization.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="border-t border-border px-5 py-3 font-mono text-xs text-muted">Mostrando {organizations.length} de {total} organizaciones</footer>
    </div>
  );
}
