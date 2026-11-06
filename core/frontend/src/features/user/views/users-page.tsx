'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Avatar,
  Badge,
  CompactStatSummary,
  type CompactStatItem,
  StatCard,
  EmptyState,
  Icons,
  InfiniteScrollSentinel,
  PullToRefresh,
  MobileFloatingActionMenu,
  MobileFilterSheet,
  FilterTriggerButton,
  Select,
} from '@/shared/components/ui';
import { userService } from '@/features/user/services/user.service';
import type { UserListItem } from '@/features/user/types/user-list';
import { useOrganizations } from '@/features/organization/hooks/use-organizations';
import { CreateUserDialog } from '@/features/user/components/create-user-dialog';
import { UserMobileCard } from '@/features/user/components/user-mobile-card';

const PAGE_SIZE = 15;

export default function UserList() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Filters state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [organizationId, setOrganizationId] = useState('all');
  const [role, setRole] = useState('all');

  // List & pagination state
  const [items, setItems] = useState<UserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Organizations for filter dropdown
  const orgsQuery = useOrganizations();
  const organizations = useMemo(() => {
    return (orgsQuery.data ?? []).map((org) => ({
      id: org.id,
      name: org.name,
    }));
  }, [orgsQuery.data]);

  // Extract available unique roles from current items
  const availableRoles = useMemo(() => {
    const rolesSet = new Set<string>();
    items.forEach((item) => {
      item.memberships.forEach((m) => {
        m.roleNames.forEach((r) => {
          if (r) rolesSet.add(r);
        });
      });
    });
    return Array.from(rolesSet).sort();
  }, [items]);

  // Client-side role filter applied over items
  const displayedItems = useMemo(() => {
    if (role === 'all') return items;
    return items.filter((user) =>
      user.memberships.some((m) => m.roleNames.includes(role))
    );
  }, [items, role]);

  // Count active secondary filters (status, organizationId, role)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== 'all') count++;
    if (organizationId !== 'all') count++;
    if (role !== 'all') count++;
    return count;
  }, [status, organizationId, role]);

  const handleClearFilters = useCallback(() => {
    setStatus('all');
    setOrganizationId('all');
    setRole('all');
  }, []);

  // Overall catalog KPI counts
  const [activeCount, setActiveCount] = useState(0);
  const [suspendedCount, setSuspendedCount] = useState(0);

  // Debounce search input (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Primary progressive data loader
  const loadPage = useCallback(
    async (targetPage: number, reset: boolean) => {
      if (reset) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const res = await userService.listPaginated({
          page: targetPage,
          limit: PAGE_SIZE,
          search: debouncedSearch.trim() || undefined,
          status: status !== 'all' ? status : undefined,
          organizationId: organizationId !== 'all' ? organizationId : undefined,
        });

        if (reset) {
          setItems(res.items);
        } else {
          setItems((prev) => [...prev, ...res.items]);
        }

        setTotal(res.total);
        setHasMore(res.hasMore);
        setPage(res.page);

        // Update overall stats baseline on first/reset load
        if (reset) {
          // If allItems were fetched or we compute from items
          const actives = res.items.filter((u) => u.status === 'ACTIVE').length;
          const suspended = res.items.filter((u) => u.status === 'SUSPENDED' || u.status === 'INACTIVE').length;
          setActiveCount(actives);
          setSuspendedCount(suspended);
        }
      } catch (err: unknown) {
        const errorObj = err as { response?: { data?: { message?: string } } };
        console.error('Error loading users:', err);
        setError(
          typeof errorObj?.response?.data?.message === 'string'
            ? errorObj.response.data.message
            : 'No se pudo cargar el listado de usuarios.'
        );
        if (reset) setItems([]);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [debouncedSearch, status, organizationId]
  );

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
    void loadPage(1, true);
  }, [debouncedSearch, status, organizationId, loadPage]);

  // Pull-to-refresh handler para móviles
  const handlePullRefresh = useCallback(async () => {
    setPage(1);
    await loadPage(1, true);
  }, [loadPage]);

  // Compact metrics for mobile strip (< 1024px)
  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: 'total',
        label: 'Total',
        value: total,
        icon: Icons.users,
      },
      {
        id: 'active',
        label: 'Activos',
        value: activeCount,
        variant: 'success',
        icon: Icons.check,
      },
      {
        id: 'suspended',
        label: 'Bloqueados/Inact.',
        value: suspendedCount,
        variant: 'warning',
        icon: Icons.shield,
      },
    ],
    [total, activeCount, suspendedCount]
  );

  return (
    <div className="flex h-full flex-col gap-5 p-4 md:p-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="text-sm text-muted">{total} usuarios registrados</p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateUserOpen(true)}
          className="hidden h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-sm font-display font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:flex"
        >
          {Icons.plus} Nuevo usuario
        </button>
      </div>

      {/* 2. KPIs y Métricas Bimodales */}
      {/* Móvil / Tablet (< 1024px / lg:hidden): CompactStatSummary minimalista */}
      <div className="lg:hidden">
        <CompactStatSummary
          items={compactMetrics}
          variant="pill"
          className="py-1"
        />
      </div>

      {/* Desktop (>= 1024px / lg:grid): 3 StatCards tradicionales */}
      <div className="hidden lg:grid grid-cols-3 gap-3.5">
        <StatCard
          label="Total Usuarios"
          value={total}
          sublabel="En plataforma central"
          icon={Icons.users}
        />
        <StatCard
          label="Usuarios Activos"
          value={activeCount}
          sublabel="Con acceso habilitado"
          variant="success"
          icon={Icons.check}
        />
        <StatCard
          label="Bloqueados o Inactivos"
          value={suspendedCount}
          sublabel="Suspendidos o pendientes"
          variant="warning"
          icon={Icons.shield}
        />
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-danger p-4 text-sm text-danger"
        >
          {error}{' '}
          <button
            type="button"
            onClick={() => void loadPage(1, true)}
            className="ml-2 underline font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 3. Filtros y Búsqueda */}
      {/* Móvil (< 768px / md:hidden): Barra compacta en una sola fila (Búsqueda rápida + FilterTriggerButton) */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {Icons.search}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario o correo…"
            className="h-9 w-full rounded-sm border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <FilterTriggerButton
          activeCount={activeFilterCount}
          onClick={() => setIsFilterSheetOpen(true)}
        />
      </div>

      {/* Desktop (>= 768px / hidden md:flex): Toolbar horizontal tradicional */}
      <div className="hidden md:flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {Icons.search}
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario o correo…"
            className="h-9 w-full rounded-sm border border-border bg-surface pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <select
          aria-label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-sm border border-border bg-surface px-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </select>

        <select
          aria-label="Organización"
          value={organizationId}
          onChange={(e) => setOrganizationId(e.target.value)}
          className="h-9 rounded-sm border border-border bg-surface px-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="all">Todas las organizaciones</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        {availableRoles.length > 0 && (
          <select
            aria-label="Rol"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-sm border border-border bg-surface px-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="all">Todos los roles</option>
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* MobileFilterSheet para móvil (< 768px) */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtros de Usuarios"
        activeCount={activeFilterCount}
        onClear={handleClearFilters}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Estado de usuario"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </Select>

          <Select
            label="Organización / Sucursal"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            <option value="all">Todas las organizaciones</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>

          {availableRoles.length > 0 && (
            <Select
              label="Rol"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">Todos los roles</option>
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          )}
        </div>
      </MobileFilterSheet>

      {/* 4. Listado Bimodal & Infinite Scroll con PullToRefresh */}
      <PullToRefresh onRefresh={handlePullRefresh}>
        {isLoading && items.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 bg-surface border border-border rounded-xl shadow-xs">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-xs font-mono text-muted">Cargando directorio de usuarios…</p>
          </div>
        ) : !error && displayedItems.length === 0 ? (
          <div className="flex-1 min-h-64 flex rounded-xl border border-dashed border-border bg-surface my-2">
            <EmptyState
              message="No se encontraron usuarios"
              description={
                debouncedSearch || status !== 'all' || organizationId !== 'all' || role !== 'all'
                  ? 'Prueba ajustando los términos de búsqueda o los filtros aplicados.'
                  : 'Aún no hay usuarios registrados en el sistema.'
              }
              action={
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(true)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  {Icons.plus} Crear usuario
                </button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* VISTA MÓVIL (< 768px / md:hidden): Tarjetas verticales <article> */}
            <div className="grid gap-3 md:hidden">
              {displayedItems.map((user) => (
                <UserMobileCard key={user.id} user={user} />
              ))}
            </div>

            {/* VISTA DESKTOP (>= 768px / hidden md:block): Tabla tradicional completa */}
            <div className="hidden overflow-x-auto rounded-md border border-border bg-surface md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-background/50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {['Usuario', 'Organización', 'Sucursales', 'Roles', 'Estado', 'Acciones'].map(
                      (label) => (
                        <th
                          key={label}
                          className={`px-4 py-3 ${label === 'Acciones' ? 'text-right' : ''}`}
                        >
                          {label}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-background/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-xs text-muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {user.memberships.map((item) => item.organizationName).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {user.memberships.flatMap((item) => item.branchNames).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {user.memberships.flatMap((item) => item.roleNames).join(', ') || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            user.status === 'ACTIVE'
                              ? 'active'
                              : user.status === 'SUSPENDED'
                              ? 'suspended'
                              : 'inactive'
                          }
                        >
                          {user.status === 'ACTIVE'
                            ? 'Activo'
                            : user.status === 'SUSPENDED'
                            ? 'Suspendido'
                            : 'Inactivo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/users/${user.id}`}
                            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background transition-colors"
                          >
                            Detalle
                          </Link>
                          <Link
                            href={`/users/${user.id}/permissions`}
                            className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-background transition-colors"
                          >
                            Permisos
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Centinela y Footer para Scroll Infinito */}
            <InfiniteScrollSentinel
              onLoadMore={() => {
                if (hasMore && !isLoading && !isLoadingMore) {
                  void loadPage(page + 1, false);
                }
              }}
              hasMore={hasMore}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              total={total}
              currentCount={displayedItems.length}
              loadingMessage="Cargando más usuarios…"
              endMessage={
                displayedItems.length > 0
                  ? `Has llegado al final del listado (${displayedItems.length} de ${total} usuarios)`
                  : undefined
              }
            />
          </div>
        )}
      </PullToRefresh>

      {/* Floating Action Menu para móvil (< 768px / md:hidden) */}
      <MobileFloatingActionMenu
        ariaLabel="Acciones rápidas de usuarios"
        actions={[
          {
            id: 'new-user',
            label: 'Nuevo Usuario',
            icon: Icons.user,
            variant: 'primary',
            onClick: () => setIsCreateUserOpen(true),
          },
        ]}
      />

      {isCreateUserOpen && (
        <CreateUserDialog
          open={isCreateUserOpen}
          onClose={() => {
            setIsCreateUserOpen(false);
            void loadPage(1, true);
          }}
        />
      )}
    </div>
  );
}
