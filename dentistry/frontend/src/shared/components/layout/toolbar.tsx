import type { ReactNode } from "react";
import { Icons } from "@/shared/components/icons/icons";

interface ToolbarSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface ToolbarProps {
  search?: ToolbarSearch;
  children?: ReactNode;
}

export function Toolbar({ search, children }: ToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      {search && (
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {Icons.search}
          </span>
          <input
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            placeholder={search.placeholder ?? "Buscar..."}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded-xl text-sm placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      )}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}
