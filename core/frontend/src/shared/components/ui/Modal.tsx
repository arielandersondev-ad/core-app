"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="size-5"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function Modal({ open, eyebrow = "Nueva organización", title, description, children, onClose }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
      className={[
        "m-auto h-dvh w-full max-w-dvh bg-transparent p-0",
        "text-foreground backdrop:bg-black/60",
        "sm:h-auto sm:max-h-[90dvh] sm:w-[min(48rem,calc(100%-2rem))]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-full min-h-0 flex-col overflow-hidden",
          "bg-surface-elevated shadow-2xl",
          "sm:max-h-[90dvh] sm:rounded-2xl sm:border sm:border-border",
        ].join(" ")}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>

            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {title}
            </h2>

            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>

          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-neutral-subtle hover:text-foreground"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </dialog>
  );
}
