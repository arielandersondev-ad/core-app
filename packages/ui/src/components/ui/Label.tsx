import { ReactNode } from "react";

export interface LabelProps {
  children: ReactNode;
  htmlFor?: string;
  className?: string;
}

export function Label({ children, htmlFor, className = "" }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-[11px] font-mono font-medium uppercase tracking-wider text-[var(--muted)] mb-1 ${className}`}
    >
      {children}
    </label>
  );
}
