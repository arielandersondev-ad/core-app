import { ReactNode } from "react";

export interface FilterToolbarProps {
  children: ReactNode;
  className?: string;
}

export function FilterToolbar({
  children,
  className = "",
}: FilterToolbarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] shadow-2xs ${className}`}
    >
      {children}
    </div>
  );
}
