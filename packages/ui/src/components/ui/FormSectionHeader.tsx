import type { ReactNode } from "react";

export interface FormSectionHeaderProps {
  step: number | string;
  title: string;
  badge?: string;
  badgeVariant?: "primary" | "muted" | "warning";
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function FormSectionHeader({
  step,
  title,
  badge,
  badgeVariant = "muted",
  description,
  action,
  className = "",
}: FormSectionHeaderProps) {
  const badgeClasses = {
    primary: "bg-[var(--primary)]/15 text-[var(--primary)] font-semibold",
    muted: "bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)] font-medium",
    warning: "bg-[var(--warning-subtle)] text-[var(--warning)] border border-[var(--warning)]/30 font-semibold",
  }[badgeVariant];

  return (
    <div
      className={`flex items-start justify-between gap-3 border-b border-[var(--border)]/70 pb-2.5 ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className="w-5.5 h-5.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs mt-0.5">
          {step}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] leading-tight">
              {title}
            </h4>
            {badge && (
              <span
                className={`text-[9px] sm:text-[10px] font-mono uppercase px-1.5 py-0.5 rounded leading-none ${badgeClasses}`}
              >
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}
