import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground active:opacity-80",
  secondary:
    "bg-secondary text-foreground active:opacity-70",
  ghost:
    "bg-transparent text-foreground active:bg-muted",
  danger:
    "bg-danger text-danger-foreground active:opacity-80",
  outline:
    "bg-transparent border border-border text-foreground active:bg-muted",
};

type ButtonProps = {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit";
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-sm",
};

export function Button({
  variant = "primary",
  children,
  onClick,
  fullWidth = false,
  size = "md",
  disabled = false,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} font-display font-semibold rounded-[3px] transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}
