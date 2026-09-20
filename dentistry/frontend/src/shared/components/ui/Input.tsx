import { InputHTMLAttributes } from "react";
import { Label } from "./Label";

export function Input({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <input
        {...props}
        className={`h-11 w-full px-3 bg-background border ${
          error ? "border-danger" : "border-border"
        } rounded-[var(--radius)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-shadow`}
      />
      {hint && !error && (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
