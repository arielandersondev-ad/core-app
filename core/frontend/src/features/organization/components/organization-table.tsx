import { Organization } from "../types/organization";
import { getOrganizationInitials } from "../utils/get-organization-initial";
import { OrganizationPlanBadge, OrganizationStatusBadge } from "./organization-badges";

type OrganizationTableProps = {
	organizations: readonly Organization[];
}
export function OrganizationTable ({ organizations }: OrganizationTableProps){
	return(<div className="mt-4 hidden overflow-hidden rounded-xl border border-border bg-surface lg:block">
    <div className="overflow-x-auto">
			{/*Tabla a remplazat por el componente data-table */}
			<table className="w-full min-w-[900px]">
			<caption className="sr-only">
				Organizaciones registradas en la plataforma
			</caption>

			<thead className="bg-background/60">
				<tr className="border-b border-border">
				{[ "Organización", "NIT", "Ciudad", "Plan", "Sucursales", "Usuarios", "Estado" ].map((heading) => (
						<th
						key={heading}
						scope="col"
						className="px-5 py-4 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-muted"
						>
						{heading}
						</th>
				))}
				</tr>
			</thead>

			<tbody className="divide-y divide-border">
					{organizations.map((organization) => (
					<tr
						key={organization.id}
						className="transition-colors hover:bg-background/70"
					>
						<td className="px-5 py-4">
						<div className="flex items-center gap-3">
							<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-xs font-bold text-primary">
							{getOrganizationInitials(organization.name)}
							</div>

							<div>
							<p className="font-semibold text-foreground">
								{organization.name}
							</p>
							<p className="mt-0.5 text-xs text-muted">
								{organization.legalName}
							</p>
							</div>
						</div>
						</td>

						<td className="px-5 py-4 font-mono text-sm text-muted">
						{organization.taxId}
						</td>

						<td className="px-5 py-4 text-sm text-foreground">
						{organization.city}
						</td>

						<td className="px-5 py-4">
						<OrganizationPlanBadge plan={organization.plan} />
						</td>

						<td className="px-5 py-4 text-sm font-semibold text-foreground">
						{organization.branchesCount}
						</td>

						<td className="px-5 py-4 text-sm font-semibold text-foreground">
						{organization.usersCount}
						</td>

						<td className="px-5 py-4">
						<OrganizationStatusBadge status={organization.status} />
						</td>
					</tr>
					))}
			</tbody>
			</table>
    </div>

    <footer className="border-t border-border px-5 py-3 font-mono text-xs text-muted">
			Mostrando {organizations.length} de {organizations.length} organizaciones
    </footer>
    </div>
    )
}