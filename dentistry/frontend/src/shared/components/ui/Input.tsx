import { InputHTMLAttributes, ReactNode } from "react";
import { Label } from "./Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-9 text-xs px-3",
  md: "h-11 text-sm px-3",
  lg: "h-12 text-base px-4",
};

export function Input({
  label,
  hint,
  error,
  leftIcon,
  inputSize = "md",
  className = "",
  ...props
}: InputProps) {
  const isSm = inputSize === "sm";

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div
            className={`absolute left-3 text-[var(--muted)] pointer-events-none flex items-center justify-center ${
              isSm ? "scale-90" : ""
            }`}
          >
            {leftIcon}
          </div>
        )}
        <input
          {...props}
          className={`${sizeClasses[inputSize]} w-full ${
            leftIcon ? "pl-9" : ""
          } bg-[var(--surface)] border ${
            error ? "border-[var(--danger)]" : "border-[var(--border)]"
          } rounded-xl text-foreground placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] transition-all ${className}`}
        />
      </div>
      {hint && !error && (
        <p className="text-[11px] text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-[11px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
