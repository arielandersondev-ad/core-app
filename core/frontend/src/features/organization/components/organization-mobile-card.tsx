import Link from "next/link";
import type { Organization } from "../types/organization";
import { getOrganizationInitials } from "../utils/get-organization-initial";
import { OrganizationPlanBadge, OrganizationStatusBadge } from "./organization-badges";
function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-5"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function OrganizationMobileCard({ organization }: { organization: Organization }) {
  return (
    <Link
      href={`/organizations/${organization.id}`}
      className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
    <article className="relative rounded-lg border border-border bg-surface transition-colors hover:bg-background/60">
      <span
        aria-hidden="true"
        className="absolute -left-px -top-px h-4 w-px bg-primary"
      />
      <span
        aria-hidden="true"
        className="absolute -left-px -top-px h-px w-4 bg-primary"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-px -right-px h-4 w-px bg-primary"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-px -right-px h-px w-4 bg-primary"
      />

      <div className="flex items-start gap-3 px-4 pb-3 pt-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-xs font-bold text-primary">
          {getOrganizationInitials(organization.name)}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-foreground">
            {organization.name}
          </h3>

          <p className="mt-1 truncate font-mono text-[10px] text-muted">
            NIT {organization.taxId}
          </p>
        </div>

        <span className="mt-1 text-muted">
          <ChevronRightIcon />
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 pb-4">
        <OrganizationStatusBadge status={organization.status} />
        <OrganizationPlanBadge plan={organization.plan} />
      </div>

      <dl className="grid grid-cols-3 border-t border-border px-4 py-3">
        <div>
          <dd className="text-sm font-semibold text-foreground">
            {organization.branchesCount}
          </dd>
          <dt className="mt-1 text-[9px] text-muted">
            Sucursales
          </dt>
        </div>

        <div>
          <dd className="text-sm font-semibold text-foreground">
            {organization.usersCount}
          </dd>
          <dt className="mt-1 text-[9px] text-muted">
            Usuarios
          </dt>
        </div>

        <div>
          <dd className="truncate text-sm font-semibold text-foreground">
            {organization.city}
          </dd>
          <dt className="mt-1 text-[9px] text-muted">
            Ciudad
          </dt>
        </div>
      </dl>
    </article>
    </Link>
  );
}
