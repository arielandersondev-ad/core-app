import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  onClick,
}: CardProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] text-left ${
        onClick ? "active:opacity-75 hover:border-[var(--primary)]/40 cursor-pointer transition-all" : ""
      } ${className}`}
    >
      {children}
    </Component>
  );
}
