import { ReactNode } from "react";

/**
 * Copia local del PageHeader del Design System para el prototipo v2.
 *
 * Diferencia única respecto a `@app/ui`: las acciones NO se ocultan en mobile.
 * El DS original las envuelve en `hidden md:inline-flex`, lo que deja los CTA
 * invisibles en pantallas pequeñas. Aquí la fila de acciones se reserva y se
 * reacomoda bajo el título en mobile, conservando el layout de desktop.
 *
 * No sustituye al componente compartido; es una propuesta aislada dentro de
 * la feature para no afectar otros consumidores.
 */

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  badge?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  breadcrumbs,
  badge,
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-2 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Migas de pan"
          className="flex items-center gap-1.5 text-xs text-muted"
        >
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <span
                key={crumb.label}
                className="inline-flex items-center gap-1.5"
              >
                {idx > 0 && <span className="opacity-40">/</span>}
                {crumb.onClick ? (
                  <button
                    type="button"
                    onClick={crumb.onClick}
                    className="hover:text-foreground transition-colors underline-offset-4 hover:underline cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.href ? (
                  <a
                    href={crumb.href}
                    className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span
                    className={
                      isLast ? "font-medium text-foreground" : "text-muted"
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex w-full flex-wrap items-center gap-2 [&>*]:flex-1 sm:w-auto sm:shrink-0 md:[&>*]:flex-none">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
