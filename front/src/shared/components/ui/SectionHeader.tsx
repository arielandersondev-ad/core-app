import { ReactNode } from "react";

export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pt-5 pb-2 text-[10px] font-mono font-medium uppercase tracking-widest text-(--muted-foreground)">
      {children}
    </p>
  );
}