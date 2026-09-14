import Link from "next/link";
import { CrowAntBrand } from "@/shared/components/brand/CrowAntBrand";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";
import { DashboardPreview } from "@/features/landing/components/dashboard-preview";
import { ProductCarousel } from "@/features/landing/components/product-carousel";
import { ArrowIcon, FeatureIcon } from "@/features/landing/components/landing-icons";

const principles = [
  {
    number: "01",
    title: "Un ecosistema coordinado",
    description:
      "Cada producto resuelve su industria y, al mismo tiempo, comparte una base sólida de usuarios, seguridad y operación.",
    icon: "ecosystem" as const,
  },
  {
    number: "02",
    title: "Claridad para decidir",
    description:
      "Información útil, flujos directos y una visión completa para actuar con la precisión de quien observa desde arriba.",
    icon: "insight" as const,
  },
  {
    number: "03",
    title: "Seguridad desde el diseño",
    description:
      "Roles, permisos y trazabilidad mantienen cada operación bajo control mientras tu organización crece.",
    icon: "security" as const,
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute left-5 top-0 h-[540px] w-px bg-gradient-to-b from-primary via-primary/40 to-transparent sm:left-10" />
      <div className="pointer-events-none absolute left-[17px] top-32 size-[7px] bg-primary sm:left-[37px]" />

      <header className="relative z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
          <Link href="/" aria-label="CrowAnt, inicio">
            <CrowAntBrand />
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted md:flex" aria-label="Navegación principal">
            <a className="transition-colors hover:text-foreground" href="#ecosistema">Ecosistema</a>
            <a className="transition-colors hover:text-foreground" href="#principios">Cómo trabajamos</a>
            <a className="transition-colors hover:text-foreground" href="#seguridad">Seguridad</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="icon" />
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Iniciar sesión
            </Link>
            <a href="#ecosistema" className="hidden h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-accent sm:inline-flex">
              Ver productos <ArrowIcon />
            </a>
          </div>
        </div>
      </header>

      <section className="relative px-6 pb-24 pt-20 sm:px-10 sm:pt-28 lg:px-12 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto inline-flex items-center gap-3 font-mono text-xs uppercase tracking-[0.22em] text-primary">
              <span className="h-px w-8 bg-primary" />
              Intelligence in collective motion
              <span className="h-px w-8 bg-primary" />
            </div>
            <h1 className="mt-7 text-balance font-display text-5xl font-semibold leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-[86px]">
              La precisión del cuervo.
              <span className="block text-primary">La fuerza de la colonia.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-muted sm:text-lg">
              CrowAnt crea productos digitales especializados que convierten operaciones complejas en sistemas claros, elegantes y coordinados.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#ecosistema" className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary-accent sm:w-auto">
                Explorar el ecosistema <ArrowIcon />
              </a>
              <a href="#principios" className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-md border border-border bg-surface/50 px-6 text-sm font-medium transition-colors hover:bg-surface sm:w-auto">
                Conocer CrowAnt <ArrowIcon diagonal />
              </a>
            </div>
          </div>

          <div className="mt-20 sm:mt-28">
            <DashboardPreview />
          </div>
        </div>
      </section>

      <section id="ecosistema" className="relative scroll-mt-20 border-y border-border bg-surface/55 px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Productos por industria</p>
              <h2 className="mt-5 max-w-xl text-balance font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Una base común. Soluciones hechas para cada mundo.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
              Desde salud hasta comercio especializado, cada producto CrowAnt conoce el lenguaje, los ritmos y las necesidades reales de su sector.
            </p>
          </div>
          <ProductCarousel />
        </div>
      </section>

      <section id="principios" className="relative scroll-mt-20 px-6 py-24 sm:px-10 lg:px-12 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Nuestra manera de construir</p>
              <h2 className="mt-5 max-w-lg text-balance font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Inteligencia individual. Impacto colectivo.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-muted">
                La elegancia no está en añadir más, sino en coordinar mejor cada parte del sistema.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {principles.map((principle) => (
                <article key={principle.number} className="group grid gap-5 py-7 sm:grid-cols-[56px_1fr_48px] sm:items-start">
                  <span className="font-mono text-xs text-gold-accent">{principle.number}</span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{principle.title}</h3>
                    <p className="mt-2 max-w-xl text-base leading-7 text-muted">{principle.description}</p>
                  </div>
                  <span className="text-primary transition-transform duration-300 group-hover:translate-x-1">
                    <FeatureIcon type={principle.icon} />
                  </span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="seguridad" className="relative scroll-mt-20 px-6 pb-24 sm:px-10 lg:px-12 lg:pb-32">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-xl border border-border bg-surface lg:grid-cols-2">
          <div className="p-8 sm:p-12 lg:p-16">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Gobierno central</p>
            <h2 className="mt-5 text-balance font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Muchos productos. Una operación bajo control.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted">
              CrowAnt Core conecta organizaciones, productos y equipos sin sacrificar autonomía, trazabilidad ni seguridad.
            </p>
            <div className="mt-10 grid grid-cols-3 border-y border-border py-6">
              {[["99.9%", "Disponibilidad"], ["24/7", "Acceso seguro"], ["100%", "Trazabilidad"]].map(([value, label]) => (
                <div key={label} className="border-r border-border px-3 first:pl-0 last:border-0 last:pr-0">
                  <p className="font-display text-2xl font-semibold text-primary sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-muted sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[400px] overflow-hidden border-t border-border bg-background lg:border-l lg:border-t-0">
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] [background-size:48px_48px]" />
            <div className="absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30" />
            <div className="absolute left-1/2 top-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-gold-accent/40" />
            <div className="absolute left-1/2 top-1/2 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary-subtle shadow-[0_0_80px_var(--primary-subtle)]">
              <CrowAntBrand compact />
            </div>
            {[["18%", "24%"], ["76%", "30%"], ["24%", "78%"], ["82%", "72%"]].map(([left, top], index) => (
              <span key={left} className="absolute size-2 bg-gold-accent" style={{ left, top }}>
                <span className="absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-accent/30" />
                <span className="sr-only">Nodo conectado {index + 1}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="relative px-6 pb-24 sm:px-10 lg:px-12 lg:pb-32">
        <div className="mx-auto max-w-7xl rounded-xl bg-primary px-7 py-14 text-primary-foreground sm:px-12 lg:flex lg:items-center lg:justify-between lg:px-16 lg:py-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.24em] opacity-70">Ecosistema CrowAnt</p>
            <h2 className="mt-4 max-w-2xl text-balance font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
              El producto correcto para cada desafío.
            </h2>
          </div>
          <a href="#ecosistema" className="mt-8 inline-flex h-12 items-center gap-3 rounded-md bg-background px-6 text-sm font-semibold text-foreground transition-transform hover:-translate-y-0.5 lg:mt-0">
            Ver productos <ArrowIcon />
          </a>
        </div>
      </section>

      <footer className="relative border-t border-border px-6 py-10 sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <CrowAntBrand />
          <p className="text-xs text-muted">© 2026 CrowAnt. Inteligencia en movimiento colectivo.</p>
          <div className="flex gap-6 text-xs text-muted">
            <a href="#" className="hover:text-foreground">Privacidad</a>
            <a href="#" className="hover:text-foreground">Términos</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
