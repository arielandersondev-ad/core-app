import type { HTMLAttributes } from "react";
import type { BadgeSize, BadgeVariant } from "./types";

export type { BadgeSize, BadgeVariant } from "./types";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-[var(--primary-subtle)] text-[var(--primary)]",
  success: "bg-[var(--success-subtle)] text-[var(--success)]",
  warning: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  danger: "bg-[var(--danger-subtle)] text-[var(--danger)]",
  neutral: "bg-[var(--neutral-subtle)] text-[var(--muted)]",
  active: "bg-[var(--success-subtle)] text-[var(--success)]",
  inactive: "bg-[var(--neutral-subtle)] text-[var(--muted)]",
  suspended: "bg-[var(--warning-subtle)] text-[var(--warning)]",
  role: "bg-[var(--primary-subtle)] text-[var(--primary)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-5 gap-1.5 px-2 py-0.5 text-[10px]",
  md: "min-h-6 gap-2 px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex w-fit items-center rounded-md font-medium leading-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {children}
    </span>
  );
}
