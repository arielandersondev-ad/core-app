"use client";

import { useMemo, useState } from "react";
import { isAxiosError } from 'axios';
import {
  EmptyState,
  CompactStatSummary,
  type CompactStatItem,
  StatCard,
  Icons,
  MobileFloatingActionMenu,
  MobileFilterSheet,
  FilterTriggerButton,
  ResponsiveModal,
  ModalFooter,
  Input,
  Select,
  Button,
} from "@/shared/components/ui";
import { OrganizationMobileCard } from "../components/organization-mobile-card";
import { OrganizationTable } from "../components/organization-table";
import { CreateOrganizationButton } from "../components/create-organization-button";
import { useOrganizations } from '../hooks/use-organizations';

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
      className="size-5"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export function OrganizationsPage() {
  const query = useOrganizations();
  const organizations = useMemo(() => query.data ?? [], [query.data]);
  const error = query.isError
    ? (isAxiosError(query.error) && typeof query.error.response?.data?.message === 'string'
      ? query.error.response.data.message
      : 'No se pudo cargar el listado de organizaciones.')
    : null;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [country, setCountry] = useState("all");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isCreateBranchOpen, setIsCreateBranchOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({
    organizationId: "",
    name: "",
    code: "",
    city: "",
    address: "",
    phone: "",
    email: "",
  });
  const [branchErrors, setBranchErrors] = useState<Record<string, string>>({});

  const activeCount = useMemo(
    () => organizations.filter((organization) => organization.status.toUpperCase() === "ACTIVE").length,
    [organizations]
  );
  const inactiveCount = organizations.length - activeCount;

  const countries = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((org) => {
      if (org.country) set.add(org.country);
    });
    return Array.from(set).sort();
  }, [organizations]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (status !== "all") count++;
    if (country !== "all") count++;
    return count;
  }, [status, country]);

  const handleClearFilters = () => {
    setStatus("all");
    setCountry("all");
  };

  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredOrganizations = organizations.filter((organization) => {
    const matchesStatus = status === "all" || organization.status.toLowerCase() === status;
    const matchesCountry = country === "all" || organization.country.toLowerCase() === country.toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 ||
      organization.name.toLocaleLowerCase("es").includes(normalizedSearch) ||
      (organization.legalName ?? '').toLocaleLowerCase("es").includes(normalizedSearch) ||
      organization.country.toLocaleLowerCase("es").includes(normalizedSearch) ||
      (organization.taxId ?? '').toLocaleLowerCase("es").includes(normalizedSearch);

    return matchesStatus && matchesCountry && matchesSearch;
  });

  // Compact metrics for mobile strip (< 1024px)
  const compactMetrics: CompactStatItem[] = useMemo(
    () => [
      {
        id: "total",
        label: "Total",
        value: organizations.length,
        icon: Icons.building,
      },
      {
        id: "active",
        label: "Activas",
        value: activeCount,
        variant: "success",
        icon: Icons.check,
      },
      {
        id: "inactive",
        label: "Inactivas",
        value: inactiveCount,
        variant: "neutral",
        icon: Icons.shield,
      },
    ],
    [organizations.length, activeCount, inactiveCount]
  );

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col p-4 sm:p-6 lg:p-8">
      {/* 1. Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            Administración
          </p>

          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
            Organizaciones
          </h2>

          <p className="mt-1 text-sm text-muted">
            Organizaciones registradas en la plataforma.
          </p>
        </div>

        <CreateOrganizationButton
          open={isCreateOrgOpen}
          onOpenChange={setIsCreateOrgOpen}
        />
      </header>

      {/* 2. KPIs Bimodales */}
      {/* Móvil / Tablet (< 1024px / lg:hidden): CompactStatSummary minimalista */}
      <div className="mt-6 lg:hidden">
        <CompactStatSummary
          items={compactMetrics}
          variant="pill"
          className="py-1"
        />
      </div>

      {/* Desktop (>= 1024px / lg:grid): 3 StatCards tradicionales */}
      <div className="mt-6 hidden lg:grid grid-cols-3 gap-3.5">
        <StatCard
          label="Total Organizaciones"
          value={organizations.length}
          sublabel="En plataforma central"
          icon={Icons.building}
        />
        <StatCard
          label="Organizaciones Activas"
          value={activeCount}
          sublabel="Operativas con suscripción"
          variant="success"
          icon={Icons.check}
        />
        <StatCard
          label="Organizaciones Inactivas"
          value={inactiveCount}
          sublabel="Desactivadas o en pausa"
          variant="default"
          icon={Icons.shield}
        />
      </div>

      {query.isPending && (
        <p role="status" className="mt-6 text-sm text-muted">
          Cargando organizaciones…
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-danger p-4 text-sm text-danger"
        >
          {error}{' '}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="ml-2 underline font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 3. Filtros y Búsqueda */}
      {/* Móvil (< 768px / md:hidden): Barra compacta en una sola fila (Búsqueda rápida + FilterTriggerButton) */}
      <div className="mt-6 flex items-center gap-2 md:hidden">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Buscar organizaciones</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar organización, país o NIT..."
            className="h-10 w-full rounded-md border border-border bg-surface pl-10 pr-3 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </label>
        <FilterTriggerButton
          activeCount={activeFilterCount}
          onClick={() => setIsFilterSheetOpen(true)}
        />
      </div>

      {/* Desktop (>= 768px / hidden md:flex): Búsqueda tradicional */}
      <div className="mt-6 hidden md:flex items-center gap-2">
        <label className="relative block min-w-0 flex-1 lg:max-w-xl">
          <span className="sr-only">Buscar organizaciones</span>

          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar organización, país o NIT..."
            className={[
              "h-11 w-full rounded-lg border border-border",
              "bg-surface pl-11 pr-4 text-sm text-foreground",
              "placeholder:text-muted",
              "focus:border-primary focus:outline-none focus:ring-1",
              "focus:ring-primary",
            ].join(" ")}
          />
        </label>
      </div>

      {/* Desktop (>= 768px / hidden md:flex): Tabs de estado tradicionales */}
      <div
        role="group"
        aria-label="Filtrar organizaciones por estado"
        className="mt-4 hidden md:flex border-b border-border"
      >
        <button
          type="button"
          aria-pressed={status === "all"}
          onClick={() => setStatus("all")}
          className={[
            "relative flex min-h-12 flex-1 items-center justify-center gap-2",
            "px-2 text-sm font-medium lg:flex-none lg:px-4",
            status === "all"
              ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Todas
          <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-xs">
            {organizations.length}
          </span>
        </button>

        <button
          type="button"
          aria-pressed={status === "active"}
          onClick={() => setStatus("active")}
          className={[
            "relative flex min-h-12 flex-1 items-center justify-center gap-2 px-2 text-sm lg:flex-none lg:px-4",
            status === "active"
              ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Activas
          <span className="text-xs">{activeCount}</span>
        </button>

        <button
          type="button"
          aria-pressed={status === "inactive"}
          onClick={() => setStatus("inactive")}
          className={[
            "relative flex min-h-12 flex-1 items-center justify-center gap-2 px-2 text-sm lg:flex-none lg:px-4",
            status === "inactive"
              ? "font-medium text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          Inactivas
          <span className="text-xs">{inactiveCount}</span>
        </button>
      </div>

      {/* MobileFilterSheet para móvil (< 768px) */}
      <MobileFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        title="Filtros de Organizaciones"
        activeCount={activeFilterCount}
        onClear={handleClearFilters}
        onApply={() => setIsFilterSheetOpen(false)}
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Estado de organización"
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Todas ({organizations.length})</option>
            <option value="active">Activas ({activeCount})</option>
            <option value="inactive">Inactivas ({inactiveCount})</option>
          </Select>

          {countries.length > 0 && (
            <Select
              label="País"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="all">Todos los países</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          )}
        </div>
      </MobileFilterSheet>

      {/* 4. Listado Bimodal & EmptyState */}
      {!query.isPending && !error && filteredOrganizations.length === 0 ? (
        <div className="flex-1 min-h-64 flex rounded-xl border border-dashed border-border bg-surface my-6">
          <EmptyState
            message="No se encontraron organizaciones"
            description={
              search || status !== "all" || country !== "all"
                ? "Prueba ajustando los términos de búsqueda o los filtros aplicados."
                : "Aún no hay organizaciones registradas en la plataforma."
            }
          />
        </div>
      ) : (
        <>
          {/* VISTA MÓVIL (< 768px / md:hidden): Tarjetas verticales */}
          <div className="mt-4 grid gap-3 md:hidden">
            {filteredOrganizations.map((organization) => (
              <OrganizationMobileCard
                key={organization.id}
                organization={organization}
              />
            ))}
          </div>

          {/* VISTA DESKTOP (>= 768px / hidden md:block): Tabla tradicional */}
          <OrganizationTable
            organizations={filteredOrganizations}
            total={organizations.length}
          />
        </>
      )}

      {/* 5. Floating Action Menu para móvil (< 768px / md:hidden) */}
      <MobileFloatingActionMenu
        ariaLabel="Acciones de organizaciones"
        actions={[
          {
            id: "new-organization",
            label: "Nueva Organización",
            icon: Icons.building,
            variant: "primary",
            onClick: () => setIsCreateOrgOpen(true),
          },
          {
            id: "new-branch",
            label: "Nueva Sucursal",
            icon: Icons.branch,
            variant: "default",
            onClick: () => {
              setBranchForm((prev) => ({
                ...prev,
                organizationId: prev.organizationId || organizations[0]?.id || "",
              }));
              setBranchErrors({});
              setIsCreateBranchOpen(true);
            },
          },
        ]}
      />

      <ResponsiveModal
        open={isCreateBranchOpen}
        onClose={() => setIsCreateBranchOpen(false)}
        title="Nueva Sucursal"
        description="Registra una nueva sucursal asociada a una organización."
        footer={
          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateBranchOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                const errs: Record<string, string> = {};
                if (!branchForm.organizationId) {
                  errs.organizationId = "Selecciona una organización";
                }
                if (!branchForm.name.trim()) {
                  errs.name = "El nombre de la sucursal es requerido";
                }
                if (!branchForm.city.trim()) {
                  errs.city = "La ciudad es requerida";
                }
                if (Object.keys(errs).length > 0) {
                  setBranchErrors(errs);
                  return;
                }
                setIsCreateBranchOpen(false);
                void query.refetch();
              }}
            >
              Crear sucursal
            </Button>
          </ModalFooter>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Select
            label="Organización *"
            value={branchForm.organizationId}
            onChange={(e) => {
              setBranchForm((prev) => ({ ...prev, organizationId: e.target.value }));
              setBranchErrors((prev) => ({ ...prev, organizationId: "" }));
            }}
            error={branchErrors.organizationId}
          >
            <option value="">Selecciona una organización</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>

          <Input
            label="Nombre de la sucursal *"
            placeholder="Ej. Sucursal Central"
            value={branchForm.name}
            onChange={(e) => {
              setBranchForm((prev) => ({ ...prev, name: e.target.value }));
              setBranchErrors((prev) => ({ ...prev, name: "" }));
            }}
            error={branchErrors.name}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Código"
              placeholder="Ej. SUC-01"
              value={branchForm.code}
              onChange={(e) =>
                setBranchForm((prev) => ({ ...prev, code: e.target.value }))
              }
            />

            <Input
              label="Ciudad *"
              placeholder="Ej. La Paz"
              value={branchForm.city}
              onChange={(e) => {
                setBranchForm((prev) => ({ ...prev, city: e.target.value }));
                setBranchErrors((prev) => ({ ...prev, city: "" }));
              }}
              error={branchErrors.city}
            />
          </div>

          <Input
            label="Dirección"
            placeholder="Av. Principal #123"
            value={branchForm.address}
            onChange={(e) =>
              setBranchForm((prev) => ({ ...prev, address: e.target.value }))
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Teléfono"
              type="tel"
              placeholder="+591 70000000"
              value={branchForm.phone}
              onChange={(e) =>
                setBranchForm((prev) => ({ ...prev, phone: e.target.value }))
              }
            />

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="sucursal@organizacion.com"
              value={branchForm.email}
              onChange={(e) =>
                setBranchForm((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
        </div>
      </ResponsiveModal>
    </section>
  );
}
