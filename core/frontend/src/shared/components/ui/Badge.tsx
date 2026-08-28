import { ReactNode } from "react";

type BadgeVariant = 'active' | 'inactive' | 'suspended' | 'enterprise' | 'professional' | 'starter' | 'role' | 'neutral';

const badgeMap: Record<BadgeVariant, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  inactive: 'bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
  suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  enterprise: 'bg-[var(--primary)]/10 text-[var(--primary)] dark:bg-[var(--primary)]/20',
  professional: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  starter: 'bg-stone-100 text-stone-500 dark:bg-stone-800/50 dark:text-stone-500',
  role: 'bg-stone-200 text-stone-700 dark:bg-stone-800 dark:text-stone-300',
  neutral: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400',
};

export function Badge({ variant = 'neutral', children }: { variant?: BadgeVariant; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium uppercase tracking-wider rounded-xs ${badgeMap[variant]}`}>
      {children}
    </span>
  );
}