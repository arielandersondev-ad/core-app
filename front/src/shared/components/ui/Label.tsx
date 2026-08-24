import { ReactNode } from "react";

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[11px] font-mono font-medium uppercase tracking-wider text-(--muted-foreground) mb-1.5">
      {children}
    </label>
  );
}