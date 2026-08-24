import { ReactNode } from "react";

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-(--card) border border-(--border) rounded-(--radius) ${onClick ? 'active:opacity-70 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}