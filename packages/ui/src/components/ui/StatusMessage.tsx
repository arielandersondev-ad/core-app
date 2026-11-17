import { type HTMLAttributes, type ReactNode } from "react";

export type StatusMessageVariant = "loading" | "error" | "info";

export interface StatusMessageProps extends HTMLAttributes<HTMLDivElement> {
  variant?: StatusMessageVariant;
  message: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * StatusMessage
 *
 * Panel único para estados de carga, error o aviso de una vista o sección.
 * - `loading`: `role="status"` + `aria-live="polite"` y spinner que respeta reduced-motion.
 * - `error`: `role="alert"`; usar `action` para reintentar o volver.
 * - `info`: `role="status"` (p. ej. sin conexión, sin permiso).
 */
export function StatusMessage({
  variant = "info",
  message,
  description,
  action,
  className = "",
  ...rest
}: StatusMessageProps) {
  const isError = variant === "error";

  return (
    <div
      data-component="status-message"
      data-variant={variant}
      role={isError ? "alert" : "status"}
      aria-live={isError ? undefined : "polite"}
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center ${className}`}
      {...rest}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-2">
        {variant === "loading" && (
          <span
            aria-hidden="true"
            className="h-5 w-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin motion-reduce:animate-none"
          />
        )}
        <p
          className={`text-sm ${isError ? "font-medium text-[var(--foreground)]" : "text-[var(--muted)]"}`}
        >
          {message}
        </p>
        {description && (
          <p className="text-xs leading-relaxed text-[var(--muted)]">{description}</p>
        )}
        {action && <div className="mt-2 flex flex-wrap items-center justify-center gap-3">{action}</div>}
      </div>
    </div>
  );
}
