import type { HTMLAttributes } from "react";

export type BadgeVariant = "primary" | "success" | "warning" | "danger" | "neutral";

export type BadgeSize = "sm" | "md";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
};

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success",
  warning: "bg-warning-subtle text-warning",
  danger: "bg-danger-subtle text-danger",
  neutral: "bg-neutral-subtle text-muted",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "min-h-5 gap-1.5 px-2 py-1 text-[10px]",
  md: "min-h-6 gap-2 px-2.5 py-1 text-xs",
};

export function Badge({
  variant = "neutral",
  size = "sm",
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex w-fit items-center rounded-md",
        "font-medium leading-none",
        variantClasses[variant],
        sizeClasses[size],
        className ?? "",
      ].join(" ")}
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