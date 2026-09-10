import { ReactNode, ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const btnMap: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--primary)] text-[var(--primary-foreground)] active:opacity-80',
  secondary: 'bg-[var(--secondary)] text-[var(--secondary-foreground)] active:opacity-70',
  ghost: 'bg-transparent text-[var(--foreground)] active:bg-[var(--muted)]',
  danger: 'bg-[var(--danger)] text-[var(--danger-foreground)] active:opacity-80',
  outline: 'bg-transparent border border-[var(--border)] text-[var(--foreground)] active:bg-[var(--muted)]',
};

const sizeMap: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
  onClick?: () => void;
  fullWidth?: boolean;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  fullWidth = false,
  size = 'md',
  disabled = false,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${btnMap[variant]} ${sizeMap[size]} ${fullWidth ? 'w-full' : ''} font-display font-semibold rounded-[var(--radius)] transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed`}
      {...rest}
    >
      {children}
    </button>
  );
}