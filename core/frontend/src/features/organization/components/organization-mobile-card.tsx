import Link from 'next/link';
import type { OrganizationListItem } from '../types/organization-list';
import { getOrganizationInitials } from '../utils/get-organization-initial';
import { OrganizationStatusBadge } from './organization-status-badge';

export function OrganizationMobileCard({ organization }: { organization: OrganizationListItem }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col gap-3 transition-colors hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-xs font-bold text-primary">
          {getOrganizationInitials(organization.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground tracking-tight">
            {organization.name}
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {organization.legalName || '—'}
          </p>
        </div>
        <OrganizationStatusBadge status={organization.status} />
      </div>

      <dl className="grid grid-cols-2 gap-2.5 border-t border-border/70 pt-3 text-xs">
        <div>
          <dt className="text-[10px] font-mono uppercase tracking-wider text-muted">NIT / Tax ID</dt>
          <dd className="mt-0.5 font-mono text-foreground">{organization.taxId || '—'}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-mono uppercase tracking-wider text-muted">País</dt>
          <dd className="mt-0.5 text-foreground">{organization.country}</dd>
        </div>
      </dl>

      <div className="flex items-center justify-end pt-2 border-t border-border/40">
        <Link
          href={`/organizations/${organization.id}`}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
        >
          Ver detalle
        </Link>
      </div>
    </article>
  );
}
