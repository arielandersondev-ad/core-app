import type { SelectHTMLAttributes, ReactNode } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  children: ReactNode;
};

export function Select({ label, children, ...props }: SelectProps) {
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
      <select
        {...props}
        className="h-11 w-full px-3 bg-background border border-border rounded-[3px] text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none transition-shadow"
      >
        {children}
      </select>
    </div>
  );
}
