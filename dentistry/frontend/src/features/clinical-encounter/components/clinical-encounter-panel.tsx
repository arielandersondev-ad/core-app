import type { ReactNode } from "react";

export interface ClinicalEncounterPanelProps {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function ClinicalEncounterPanel({
  id,
  title,
  description,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "",
}: ClinicalEncounterPanelProps) {
  return (
    <section
      aria-labelledby={id}
      className={`overflow-hidden rounded-xl border border-border bg-surface shadow-2xs ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 id={id} className="font-display text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={`px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export const Panel = ClinicalEncounterPanel;
