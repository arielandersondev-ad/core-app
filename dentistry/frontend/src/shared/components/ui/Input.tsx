import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={props.id}
          className="text-[11px] font-mono uppercase tracking-wider text-muted"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={`h-11 w-full px-3 bg-background border ${
          error ? "border-danger" : "border-border"
        } rounded-[3px] text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary transition-shadow`}
      />
      {hint && !error && (
        <p className="text-[11px] text-muted">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-danger">{error}</p>
      )}
    </div>
  );
}
