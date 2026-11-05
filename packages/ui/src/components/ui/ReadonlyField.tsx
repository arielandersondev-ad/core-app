import { ReactNode } from "react";
import { Label } from "./Label";

export interface ReadonlyFieldProps {
  id?: string;
  label?: string;
  value: ReactNode;
  icon?: ReactNode;
  badge?: string;
  helperText?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ReadonlyField({
  id,
  label,
  value,
  icon,
  badge,
  helperText,
  size = "sm",
  className = "",
}: ReadonlyFieldProps) {
  const heightClass = size === "sm" ? "h-9 text-xs px-3" : "h-11 text-sm px-3.5";

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div
        id={id}
        className={`${heightClass} w-full rounded-md bg-[var(--surface-subtle)]/75 border border-[var(--border)]/70 text-[var(--foreground)] flex items-center justify-between gap-2 cursor-default select-text transition-colors`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {icon && (
            <span className="shrink-0 text-[var(--muted)] opacity-85">
              {icon}
            </span>
          )}
          <span className="truncate font-medium">{value}</span>
        </div>
        {badge && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
            {badge}
          </span>
        )}
      </div>
      {helperText && (
        <p className="text-[11px] text-[var(--muted)]">{helperText}</p>
      )}
    </div>
  );
}
