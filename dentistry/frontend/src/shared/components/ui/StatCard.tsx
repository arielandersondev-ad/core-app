import { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: "default" | "success" | "warning" | "danger" | "accent";
  icon?: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

const variantStyles: Record<
  NonNullable<StatCardProps["variant"]>,
  { valueText: string; activeBorder: string; badgeBg: string }
> = {
  default: {
    valueText: "text-[var(--foreground)]",
    activeBorder: "border-[var(--primary)] bg-[var(--primary-subtle)]/40",
    badgeBg: "text-[var(--muted)]",
  },
  success: {
    valueText: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20",
    badgeBg: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    valueText: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
    badgeBg: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    valueText: "text-[var(--danger)] dark:text-red-400",
    activeBorder: "border-red-500 bg-red-50 dark:bg-red-950/20",
    badgeBg: "text-[var(--danger)] dark:text-red-400",
  },
  accent: {
    valueText: "text-[var(--primary)] dark:text-[var(--primary-accent)]",
    activeBorder: "border-[var(--primary)] bg-[var(--primary-subtle)]",
    badgeBg: "text-[var(--primary)]",
  },
};

export function StatCard({
  label,
  value,
  sublabel,
  variant = "default",
  icon,
  onClick,
  active = false,
  className = "",
}: StatCardProps) {
  const styles = variantStyles[variant];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`p-4 rounded-xl border flex flex-col justify-between text-left transition-all ${
        active
          ? `${styles.activeBorder} ring-1 ring-[var(--primary)]/30 shadow-xs`
          : onClick
            ? "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-subtle)]/20 cursor-pointer shadow-xs active:scale-[0.99]"
            : "border-[var(--border)] bg-[var(--surface)] shadow-xs"
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2 w-full">
        <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-[var(--muted)]">
          {label}
        </span>
        {icon && (
          <span className={`text-base sm:text-lg ${styles.badgeBg}`}>
            {icon}
          </span>
        )}
      </div>

      <div className="mt-2">
        <p
          className={`font-display font-bold text-2xl sm:text-3xl tracking-tight leading-none ${styles.valueText}`}
        >
          {value}
        </p>
        {sublabel && (
          <p className="text-[11px] text-[var(--muted)] mt-1.5 line-clamp-1">
            {sublabel}
          </p>
        )}
      </div>
    </Component>
  );
}
