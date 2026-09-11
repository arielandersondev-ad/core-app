"use client";

import { useState } from "react";
import { CreateOrganizationButton } from "../components/create-organization-button";
import { OrganizationMobileCard } from "../components/organization-mobile-card";
import { OrganizationTable } from "../components/organization-table";
import { organizations } from "../data/organizations.mock";

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

function FilterIcon() {
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
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
      <circle cx="9" cy="6" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="11" cy="18" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");

  const activeCount = organizations.filter(
    (organization) => organization.status === "active",
  ).length;

  const inactiveCount = organizations.length - activeCount;
  const normalizedSearch = search.trim().toLocaleLowerCase("es");
  const filteredOrganizations = organizations.filter((organization) => {
    const matchesStatus = status === "all" || organization.status === status;
    const matchesSearch =
      normalizedSearch.length === 0 ||
      organization.name.toLocaleLowerCase("es").includes(normalizedSearch) ||
      organization.legalName.toLocaleLowerCase("es").includes(normalizedSearch) ||
      organization.city.toLocaleLowerCase("es").includes(normalizedSearch) ||
      organization.taxId.toLocaleLowerCase("es").includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  return (
    <section className="mx-auto flex w-full max-w-[1440px] flex-col p-4 sm:p-6 lg:p-8">
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
        <CreateOrganizationButton/>
      </header>

      <div className="mt-6 flex items-center gap-2">
        <label className="relative block min-w-0 flex-1 lg:max-w-xl">
          <span className="sr-only">Buscar organizaciones</span>

          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar organización, ciudad o NIT..."
            className={[
              "h-11 w-full rounded-lg border border-border",
              "bg-surface pl-11 pr-4 text-sm text-foreground",
              "placeholder:text-muted",
              "focus:border-primary focus:outline-none focus:ring-1",
              "focus:ring-primary",
            ].join(" ")}
          />
        </label>

        <button
          type="button"
          aria-label="Mostrar filtros"
          className={[
            "inline-flex size-11 shrink-0 items-center justify-center",
            "rounded-lg border border-border bg-surface text-muted",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary lg:w-auto lg:gap-2 lg:px-4",
          ].join(" ")}
        >
          <FilterIcon />
          <span className="hidden text-sm lg:inline">Filtros</span>
        </button>
      </div>

      <div
        role="group"
        aria-label="Filtrar organizaciones por estado"
        className="mt-4 flex border-b border-border"
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

      <div className="mt-4 grid gap-3 lg:hidden">
        {filteredOrganizations.map((organization) => (
          <OrganizationMobileCard
            key={organization.id}
            organization={organization}
          />
        ))}
      </div>
      <OrganizationTable
        organizations={filteredOrganizations}
        total={organizations.length}
      />

      {filteredOrganizations.length === 0 && (
        <p className="py-12 text-center text-sm text-muted">
          No se encontraron organizaciones con esos filtros.
        </p>
      )}
    </section>
  );
}
