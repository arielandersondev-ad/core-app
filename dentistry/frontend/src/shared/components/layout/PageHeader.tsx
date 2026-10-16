import { ReactNode } from "react";
import Link from "next/link";

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
          className="flex items-center gap-1.5 text-xs text-[var(--muted)]"
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
                    className="hover:text-[var(--foreground)] transition-colors underline-offset-4 hover:underline cursor-pointer"
                  >
                    {crumb.label}
                  </button>
                ) : crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-[var(--foreground)] transition-colors underline-offset-4 hover:underline"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? "font-medium text-[var(--foreground)]"
                        : "text-[var(--muted)]"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}
