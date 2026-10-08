import { ReactNode } from "react";

export interface SectionHeaderProps {
  children: ReactNode;
  className?: string;
}

export function SectionHeader({ children, className = "" }: SectionHeaderProps) {
  return (
    <p className={`px-4 pt-5 pb-2 text-[10px] font-mono font-medium uppercase tracking-widest text-[var(--muted)] ${className}`}>
      {children}
    </p>
  );
}
