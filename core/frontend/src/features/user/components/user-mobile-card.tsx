import Link from 'next/link';
import { Avatar, Badge } from '@/shared/components/ui';
import type { UserListItem } from '../types/user-list';

type UserMobileCardProps = {
  user: UserListItem;
};

export function UserMobileCard({ user }: UserMobileCardProps) {
  const organizations = user.memberships.map((m) => m.organizationName);
  const roles = user.memberships.flatMap((m) => m.roleNames);
  const branches = user.memberships.flatMap((m) => m.branchNames);

  const badgeVariant =
    user.status === 'ACTIVE' ? 'active' : user.status === 'SUSPENDED' ? 'suspended' : 'inactive';
  const statusText =
    user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo';

  return (
    <article className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col gap-3 transition-colors hover:border-primary/40">
      {/* Cabecera: Avatar, Nombre, Email y Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={`${user.firstName} ${user.lastName}`} size="md" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground tracking-tight">
              {user.firstName} {user.lastName}
            </h3>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>
        <Badge variant={badgeVariant}>{statusText}</Badge>
      </div>

      {/* Chips de Organización, Roles y Sucursales */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border/70">
        {organizations.length > 0 ? (
          organizations.map((org, idx) => (
            <span
              key={idx}
              className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-elevated text-muted border border-border"
            >
              {org}
            </span>
          ))
        ) : (
          <span className="text-[10px] font-mono text-muted">Sin organización</span>
        )}

        {roles.map((role, idx) => (
          <span
            key={`role-${idx}`}
            className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary-subtle text-primary border border-primary/20"
          >
            {role}
          </span>
        ))}

        {branches.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-subtle text-muted border border-border">
            <span className="opacity-75">📍</span> {branches.join(', ')}
          </span>
        )}
      </div>

      {/* Menú de acciones accesible */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
        <Link
          href={`/users/${user.id}`}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
        >
          Ver detalle
        </Link>
        <Link
          href={`/users/${user.id}/permissions`}
          className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
        >
          Permisos
        </Link>
      </div>
    </article>
  );
}
