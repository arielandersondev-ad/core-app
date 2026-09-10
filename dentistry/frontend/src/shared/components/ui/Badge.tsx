import type { ReactNode } from "react";

type BadgeVariant = "active" | "inactive" | "suspended" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive:
    "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
  suspended:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  neutral:
    "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({ variant = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-[2px] ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
