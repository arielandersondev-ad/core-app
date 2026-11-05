"use client";

import { type ReactNode, type HTMLAttributes } from "react";

export interface MobileCardField {
  label: ReactNode;
  value: ReactNode;
  className?: string;
  mono?: boolean;
}

export interface MobileCardItemProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  avatar?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  fields?: MobileCardField[];
  actions?: ReactNode;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

/**
 * MobileCardItem
 *
 * Tarjeta vertical estandarizada para vistas móviles (< 768px),
 * optimizada para representar registros de datos (pacientes, usuarios,
 * organizaciones, roles, planes) sin desborde horizontal ni scroll incómodo.
 */
export function MobileCardItem({
  avatar,
  title,
  subtitle,
  badge,
  fields,
  actions,
  onClick,
  className = "",
  children,
  ...rest
}: MobileCardItemProps) {
  const isInteractive = Boolean(onClick);

  return (
    <article
      data-component="mobile-card-item"
      onClick={onClick}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xs transition-colors ${
        isInteractive
          ? "cursor-pointer hover:border-[var(--primary)]/50 active:scale-[0.99]"
          : ""
      } ${className}`}
      {...rest}
    >
      {/* Header row: Avatar, Title / Subtitle, Status Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--foreground)] font-display">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      {/* Structured data fields */}
      {fields && fields.length > 0 && (
        <dl className="mt-3.5 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-[var(--border)]/70 pt-3 text-xs">
          {fields.map((field, index) => (
            <div key={index} className={field.className}>
              <dt className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                {field.label}
              </dt>
              <dd
                className={`mt-0.5 text-xs text-[var(--foreground)] font-medium truncate ${
                  field.mono ? "font-mono" : ""
                }`}
              >
                {field.value ?? "—"}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Optional custom children */}
      {children && <div className="mt-3">{children}</div>}

      {/* Optional card action buttons */}
      {actions && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]/70 pt-3">
          {actions}
        </div>
      )}
    </article>
  );
}
