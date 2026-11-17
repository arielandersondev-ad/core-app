"use client";

import { type ReactNode, type HTMLAttributes } from "react";

export type CompactStatVariant =
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

export interface CompactStatItem {
  id?: string;
  label: string;
  value: string | number;
  /** Prefijo visual opcional para valores o monedas (ej. 'Bs.', '$') */
  prefix?: ReactNode;
  /** Sufijo visual opcional para unidades (ej. '/mes', '%', 'min') */
  suffix?: ReactNode;
  sublabel?: string;
  icon?: ReactNode;
  variant?: CompactStatVariant;
  active?: boolean;
  onClick?: () => void;
  badge?: ReactNode;
}

export interface CompactStatSummaryProps extends HTMLAttributes<HTMLDivElement> {
  items: CompactStatItem[];
  /** Si es true, se oculta en desktop (>= 768px / md:hidden) para mostrar solo en móvil */
  mobileOnly?: boolean;
  /** Variante visual de los elementos (pill redondeado o card compacta) */
  variant?: "pill" | "card";
  /** Espaciado entre elementos (default: 'gap-2') */
  gap?: "gap-1.5" | "gap-2" | "gap-2.5" | "gap-3";
  className?: string;
  itemClassName?: string;
}

const variantStyles: Record<
  CompactStatVariant,
  { valueText: string; activeClasses: string; iconBg: string }
> = {
  default: {
    valueText: "text-[var(--foreground)]",
    activeClasses: "border-[var(--primary)] bg-[var(--primary-subtle)]/50 text-[var(--primary)]",
    iconBg: "text-[var(--muted)]",
  },
  accent: {
    valueText: "text-[var(--primary)]",
    activeClasses: "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary)]",
    iconBg: "text-[var(--primary)]",
  },
  success: {
    valueText: "text-emerald-600 dark:text-emerald-400",
    activeClasses: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600",
    iconBg: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    valueText: "text-amber-600 dark:text-amber-400",
    activeClasses: "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-600",
    iconBg: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    valueText: "text-[var(--danger)] dark:text-red-400",
    activeClasses: "border-red-500 bg-red-50 dark:bg-red-950/30 text-[var(--danger)]",
    iconBg: "text-[var(--danger)]",
  },
  neutral: {
    valueText: "text-[var(--muted)]",
    activeClasses: "border-[var(--border)] bg-[var(--neutral-subtle)] text-[var(--foreground)]",
    iconBg: "text-[var(--muted)]",
  },
};

/**
 * CompactStatSummary (o MinimalStatStrip)
 *
 * Franja horizontal compacta de micro-métricas de una sola línea para pantallas móviles (~38px - 44px de altura).
 * Reemplaza los StatCards tradicionales que en viewport móvil ocupan la mitad de la pantalla vertical,
 * proveyendo chips/pills con scroll horizontal suave, icono, número destacado, formato monetario y label breve,
 * liberando más del 80% del viewport vertical móvil para el contenido y tarjetas.
 */
export function CompactStatSummary({
  items,
  mobileOnly = false,
  variant = "pill",
  gap = "gap-2",
  className = "",
  itemClassName = "",
  ...rest
}: CompactStatSummaryProps) {
  return (
    <div
      data-component="compact-stat-summary"
      className={`w-full overflow-x-auto py-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        mobileOnly ? "md:hidden" : ""
      } ${className}`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      {...rest}
    >
      <div className={`flex items-center ${gap} min-w-max px-0.5`}>
        {items.map((item, index) => {
          const itemKey = item.id ?? index;
          const itemVariant = item.variant ?? "default";
          const styles = variantStyles[itemVariant];
          const isInteractive = Boolean(item.onClick);
          const Component = isInteractive ? "button" : "div";

          const shapeClasses =
            variant === "pill"
              ? "rounded-full min-h-[38px] h-[38px] px-3.5"
              : "rounded-xl min-h-[42px] h-[42px] px-3";

          const interactiveClasses = isInteractive
            ? "cursor-pointer active:scale-95 hover:border-[var(--primary)]/60 transition-all select-none"
            : "";

          const activeClasses = item.active
            ? `${styles.activeClasses} ring-1 ring-[var(--primary)]/40 shadow-xs font-semibold`
            : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-elevated)]";

          return (
            <Component
              key={itemKey}
              type={isInteractive ? "button" : undefined}
              onClick={item.onClick}
              className={`shrink-0 inline-flex items-center gap-2 border text-left shadow-2xs whitespace-nowrap ${shapeClasses} ${interactiveClasses} ${activeClasses} ${itemClassName}`}
            >
              {item.icon && (
                <span
                  className={`flex items-center justify-center shrink-0 text-sm ${styles.iconBg}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
              )}

              <span
                className={`font-display font-bold text-sm tracking-tight inline-flex items-baseline gap-0.5 ${
                  item.active ? "" : styles.valueText
                }`}
              >
                {item.prefix && (
                  <span className="text-[11px] font-mono font-medium opacity-80 mr-0.5">
                    {item.prefix}
                  </span>
                )}
                <span>{item.value}</span>
                {item.suffix && (
                  <span className="text-[10px] font-mono opacity-75 ml-0.5">
                    {item.suffix}
                  </span>
                )}
              </span>

              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                {item.label}
              </span>

              {item.badge && (
                <span className="ml-1 shrink-0">{item.badge}</span>
              )}
            </Component>
          );
        })}
      </div>
    </div>
  );
}

// Alias semántico para la franja minimalista de estadísticas
export const MinimalStatStrip = CompactStatSummary;
