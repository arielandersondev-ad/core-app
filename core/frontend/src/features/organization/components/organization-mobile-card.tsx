import type { OrganizationListItem } from '../types/organization-list';
import { getOrganizationInitials } from '../utils/get-organization-initial';
import { OrganizationStatusBadge } from './organization-badges';

export function OrganizationMobileCard({ organization }: { organization: OrganizationListItem }) {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-xs font-bold text-primary">{getOrganizationInitials(organization.name)}</div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">{organization.name}</h3>
          <p className="mt-1 truncate text-xs text-muted">{organization.legalName || '—'}</p>
        </div>
        <OrganizationStatusBadge status={organization.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-3 text-sm">
        <div><dt className="text-xs text-muted">NIT</dt><dd className="font-mono">{organization.taxId || '—'}</dd></div>
        <div><dt className="text-xs text-muted">País</dt><dd>{organization.country}</dd></div>
      </dl>
    </article>
  );
}
