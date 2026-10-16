import { InputHTMLAttributes, ReactNode } from "react";
import { Label } from "./Label";

export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  inputSize?: InputSize;
}

const sizeClasses: Record<InputSize, string> = {
  sm: "h-9 text-xs px-3",
  md: "h-11 text-sm px-3",
  lg: "h-12 text-base px-4",
};

export function Input({
  label,
  hint,
  error,
  leftIcon,
  rightIcon,
  inputSize = "md",
  className = "",
  id,
  disabled,
  ...props
}: InputProps) {
  const isSm = inputSize === "sm";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div
            className={`absolute left-3 text-[var(--muted)] pointer-events-none flex items-center justify-center shrink-0 ${
              isSm ? "scale-90" : ""
            }`}
          >
            {leftIcon}
          </div>
        )}
        <input
          id={id}
          disabled={disabled}
          className={`${sizeClasses[inputSize]} w-full ${
            leftIcon ? "pl-9" : ""
          } ${rightIcon ? "pr-9" : ""} bg-[var(--surface)] border ${
            error ? "border-[var(--danger)] ring-1 ring-[var(--danger)]/30" : "border-[var(--border)]"
          } rounded-[var(--radius)] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {rightIcon && (
          <div
            className={`absolute right-3 text-[var(--muted)] flex items-center justify-center shrink-0 ${
              isSm ? "scale-90" : ""
            }`}
          >
            {rightIcon}
          </div>
        )}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-[11px] text-[var(--danger)] font-medium">{error}</p>}
    </div>
  );
}
