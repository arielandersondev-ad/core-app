import { ReactNode } from "react";

export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius)] ${onClick ? 'active:opacity-70 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}