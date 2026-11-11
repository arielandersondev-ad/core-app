import { ReactNode, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const btnMap: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary-accent)] active:opacity-90 shadow-2xs",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-90 active:opacity-80 shadow-2xs",
  ghost:
    "bg-transparent text-[var(--foreground)] hover:bg-[var(--neutral-subtle)] active:bg-[var(--muted)]/20",
  danger:
    "bg-[var(--danger)] text-[var(--danger-foreground)] hover:opacity-90 active:opacity-80 shadow-2xs",
  outline:
    "bg-transparent border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--neutral-subtle)] active:bg-[var(--muted)]/20",
};

const sizeMap: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-sm sm:text-base gap-2.5",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center font-display font-semibold rounded-[var(--radius)] transition-[background-color,border-color,color,opacity,box-shadow] duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]/40";

export interface ButtonClassNameOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Clases visuales de Button para aplicarlas a elementos de navegación
 * (`<a>` / `next/link`) sin duplicar strings de estilos en cada feature.
 * Usar `<Button>` para acciones y `buttonClassName()` sobre un link para navegación.
 *
 * `ui-button` y `ui-button--<variant>` no tienen estilos propios: son ganchos
 * estables para que los temas (p. ej. styles/christmas.css) decoren botones
 * sin depender de clases utilitarias.
 */
export function buttonClassName({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
}: ButtonClassNameOptions = {}): string {
  return [
    "ui-button",
    `ui-button--${variant}`,
    BASE_CLASSES,
    btnMap[variant],
    sizeMap[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? (
        <svg
          aria-hidden="true"
          className="animate-spin motion-reduce:animate-none -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        leftIcon && (
          <span aria-hidden="true" className="shrink-0 flex items-center">
            {leftIcon}
          </span>
        )
      )}
      {children}
      {!loading && rightIcon && (
        <span aria-hidden="true" className="shrink-0 flex items-center">
          {rightIcon}
        </span>
      )}
    </button>
  );
}
