import Link from "next/link";
import { LoginForm } from "@/features/auth/components/login-form";
import { CrowAntBrand } from "@/shared/components/brand/CrowAntBrand";
import { ThemeToggle } from "@/shared/components/theme-toggle/theme-toggle";

export default function LoginPage({ returnTo }: { returnTo?: string }) {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-[0.045] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:64px_64px]" />

      <div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden border-r border-border bg-surface/55 p-12 lg:flex lg:flex-col xl:p-16">
          <Link href="/" className="w-fit" aria-label="Volver al inicio de CrowAnt">
            <CrowAntBrand />
          </Link>

          <div className="my-auto max-w-xl py-16">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary">Acceso privado</p>
            <h1 className="mt-6 text-balance font-display text-5xl font-semibold leading-[1.03] tracking-[-0.04em] xl:text-6xl">
              Tu ecosistema, coordinado desde un solo lugar.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-muted">
              Ingresa a CrowAnt Core para administrar organizaciones, productos, equipos y permisos con una visión completa.
            </p>

            <div className="mt-12 grid grid-cols-3 border-y border-border py-6">
              {[["01", "Correo"], ["02", "Contraseña"], ["03", "Core"]].map(([number, label]) => (
                <div key={number} className="border-r border-border px-4 first:pl-0 last:border-0">
                  <p className="font-mono text-xs text-gold-accent">{number}</p>
                  <p className="mt-2 text-sm text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Intelligence in collective motion
          </p>
        </section>

        <section className="flex min-h-dvh flex-col px-6 py-6 sm:px-10 lg:px-14 xl:px-20">
          <div className="flex items-center justify-between lg:justify-end">
            <Link href="/" className="lg:hidden" aria-label="Volver al inicio de CrowAnt">
              <CrowAntBrand />
            </Link>
            <ThemeToggle variant="icon" />
          </div>

          <div className="my-auto w-full max-w-md self-center py-12">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground">
              <span aria-hidden="true">←</span> Volver al inicio
            </Link>
            <p className="mt-10 font-mono text-xs uppercase tracking-[0.24em] text-primary">Administración CrowAnt</p>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em]">Acceso a Core</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Ingresa con tu correo electrónico y contraseña.
            </p>

            <LoginForm returnTo={returnTo} />

            <div className="mt-8 flex items-start gap-3 border-t border-border pt-6 text-sm leading-6 text-muted">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
              El acceso se mantiene en una sesión segura y se cierra automáticamente al expirar.
            </div>
          </div>

          <p className="text-center text-xs text-muted">© 2026 CrowAnt · Acceso reservado</p>
        </section>
      </div>
    </main>
  );
}
