import { SelectHTMLAttributes, ReactNode } from "react";
import { Label } from "./Label";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  selectSize?: "sm" | "md";
  error?: string;
  options?: SelectOption[];
  children?: ReactNode;
}

export function Select({
  label,
  children,
  options,
  selectSize = "md",
  error,
  className = "",
  id,
  disabled,
  ...props
}: SelectProps) {
  const heightClass = selectSize === "sm" ? "h-9 text-xs" : "h-11 text-sm";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative w-full">
        <select
          id={id}
          disabled={disabled}
          {...props}
          className={`${heightClass} w-full px-3 pr-8 bg-[var(--surface)] border ${
            error ? "border-[var(--danger)] ring-1 ring-[var(--danger)]/30" : "border-[var(--border)]"
          } rounded-[var(--radius)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer ${className}`}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
      {error && <p className="text-[11px] text-[var(--danger)] font-medium">{error}</p>}
    </div>
  );
}
