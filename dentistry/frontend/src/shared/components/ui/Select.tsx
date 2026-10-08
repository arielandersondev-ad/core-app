import { SelectHTMLAttributes } from "react";
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
}

export function Select({
  label,
  children,
  options,
  selectSize = "md",
  error,
  className = "",
  ...props
}: SelectProps) {
  const heightClass = selectSize === "sm" ? "h-9 text-xs" : "h-11 text-sm";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <select
        {...props}
        className={`${heightClass} w-full px-3 bg-[var(--surface)] border ${
          error ? "border-[var(--danger)]" : "border-[var(--border)]"
        } rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all ${className}`}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-[11px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
