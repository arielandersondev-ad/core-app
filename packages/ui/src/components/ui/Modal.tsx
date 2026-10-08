import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  maxWidth?: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl";
  children: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  description,
  eyebrow,
  icon,
  maxWidth = "max-w-2xl",
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const displaySubtitle = subtitle || description;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!open) return null;

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={`backdrop:bg-black/50 backdrop:backdrop-blur-xs bg-transparent p-3 sm:p-4 m-auto rounded-2xl shadow-2xl ${maxWidth} w-full`}
    >
      <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--primary)] font-semibold">
                  {eyebrow}
                </p>
              )}
              <h2 className="font-display font-bold text-[var(--foreground)] text-base sm:text-lg leading-tight truncate">
                {title}
              </h2>
              {displaySubtitle && (
                <p className="text-xs text-[var(--muted)] mt-0.5 truncate">
                  {displaySubtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-subtle)] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </dialog>
  );
}
