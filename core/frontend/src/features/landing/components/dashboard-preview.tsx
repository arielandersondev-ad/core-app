import { CrowAntBrand } from "@/shared/components/brand/CrowAntBrand";

const organizations = [
  { name: "Clínica Horizonte", sector: "Dentistry", users: 24 },
  { name: "Farmacia Central", sector: "Pharma", users: 16 },
  { name: "Huella Viva", sector: "Petshop", users: 12 },
  { name: "Visión Norte", sector: "Oftalmología", users: 9 },
];

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[1120px]" aria-label="Vista previa de CrowAnt Core">
      <div className="absolute -inset-12 -z-10 bg-[radial-gradient(circle_at_center,var(--primary-subtle),transparent_68%)] opacity-40 blur-3xl" />
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-[0_30px_100px_rgba(0,0,0,0.24)]">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4 sm:px-6">
          <span className="size-2 rounded-full bg-danger/70" />
          <span className="size-2 rounded-full bg-warning/70" />
          <span className="size-2 rounded-full bg-primary/70" />
          <div className="mx-auto h-6 w-1/3 rounded-sm border border-border bg-background/60" />
        </div>

        <div className="grid min-h-[390px] grid-cols-1 md:grid-cols-[210px_1fr]">
          <aside className="hidden border-r border-border bg-background/35 p-5 md:flex md:flex-col">
            <CrowAntBrand />
            <nav className="mt-10 space-y-2 text-sm text-muted" aria-label="Vista previa del panel">
              {["Resumen", "Productos", "Organizaciones", "Equipo", "Reportes"].map((item, index) => (
                <div
                  key={item}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 ${
                    index === 2 ? "bg-primary-subtle text-foreground" : ""
                  }`}
                >
                  <span className={`size-1.5 ${index === 2 ? "bg-primary" : "border border-current"}`} />
                  {item}
                </div>
              ))}
            </nav>
            <p className="mt-auto font-mono text-xs uppercase leading-5 tracking-[0.24em] text-muted">
              One ecosystem
              <br />many industries
            </p>
          </aside>

          <div className="min-w-0 p-5 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">CrowAnt Core</p>
                <h3 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Organizaciones</h3>
                <p className="mt-1 text-sm text-muted">Todo tu ecosistema desde un solo lugar.</p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="size-8 rounded-full bg-primary-subtle" />
                <div className="text-right text-xs">
                  <p className="font-medium">Alex Morgan</p>
                  <p className="text-muted">Administrador</p>
                </div>
              </div>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-4">
              {[["Organizaciones", "24"], ["Productos", "05"], ["Usuarios", "186"]].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-background/45 p-3 sm:p-4">
                  <p className="truncate text-xs text-muted">{label}</p>
                  <p className="mt-2 font-display text-lg font-semibold sm:text-2xl">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-md border border-border bg-background/20">
              <div className="grid grid-cols-[1.35fr_0.8fr_0.45fr] border-b border-border px-4 py-3 font-mono text-xs uppercase tracking-[0.12em] text-muted sm:grid-cols-[1.35fr_0.8fr_0.45fr_0.6fr]">
                <span>Organización</span>
                <span>Producto</span>
                <span>Equipo</span>
                <span className="hidden sm:block">Estado</span>
              </div>
              {organizations.map((organization) => (
                <div
                  key={organization.name}
                  className="grid grid-cols-[1.35fr_0.8fr_0.45fr] items-center border-b border-border/70 px-4 py-3 text-xs last:border-b-0 sm:grid-cols-[1.35fr_0.8fr_0.45fr_0.6fr] sm:text-sm"
                >
                  <span className="truncate font-medium">{organization.name}</span>
                  <span className="truncate text-muted">{organization.sector}</span>
                  <span>{organization.users}</span>
                  <span className="hidden items-center gap-2 text-primary sm:flex">
                    <span className="size-1.5 rounded-full bg-primary" /> Activa
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-2 hidden w-52 rounded-lg border border-border bg-surface-elevated p-4 shadow-2xl sm:block lg:-right-8">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Actividad semanal</span>
          <span className="size-2 rounded-full bg-primary" />
        </div>
        <p className="mt-2 font-display text-2xl font-semibold">84.6%</p>
        <div className="mt-4 flex h-10 items-end gap-1">
          {[35, 52, 44, 70, 58, 82, 68, 92, 76, 100, 82, 95].map((height, index) => (
            <span
              key={`${height}-${index}`}
              className="flex-1 bg-primary/70"
              style={{ height: `${height}%`, opacity: 0.35 + index * 0.045 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
