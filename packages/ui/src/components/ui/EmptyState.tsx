import { type ReactNode, type HTMLAttributes } from "react";

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  message: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState
 *
 * Componente expansivo de estado vacío para listas, tablas y paneles.
 * Ocupa siempre el máximo espacio disponible de su contenedor padre (`w-full h-full flex-1 min-h-0 justify-center`)
 * mediante Flexbox dinámico y control de overflow, cumpliendo la regla estricta de NO usar position: absolute.
 */
export function EmptyState({
  message,
  description,
  icon,
  action,
  className = "",
  ...rest
}: EmptyStateProps) {
  return (
    <div
      data-component="empty-state"
      className={`w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center py-10 sm:py-16 px-4 gap-3 text-center ${className}`}
      {...rest}
    >
      <div className="w-12 h-12 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center text-[var(--muted)] bg-[var(--surface-subtle)] shrink-0">
        {icon || (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>

      <div className="max-w-md">
        <p className="text-sm font-semibold text-[var(--foreground)] font-display">
          {message}
        </p>
        {description && (
          <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-2 shrink-0">{action}</div>}
    </div>
  );
}
