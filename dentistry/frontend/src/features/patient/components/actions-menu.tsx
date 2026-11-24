"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";

const CloseContext = createContext<() => void>(() => undefined);

/** Menú desplegable de acciones secundarias (⋯). Se cierra con Escape y al hacer clic fuera. */
export function ActionsMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-subtle"
      >
        <span aria-hidden="true" className="text-lg leading-none">⋯</span>
      </button>
      {open && (
        <CloseContext.Provider value={() => setOpen(false)}>
          <div
            id={menuId}
            role="menu"
            aria-label={label}
            className="absolute right-0 z-30 mt-2 min-w-56 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
          >
            {children}
          </div>
        </CloseContext.Provider>
      )}
    </div>
  );
}

export function MenuItem({
  onSelect,
  danger = false,
  children,
}: {
  onSelect: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  const close = useContext(CloseContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => {
        close();
        onSelect();
      }}
      className={`block w-full cursor-pointer px-4 py-2.5 text-left text-sm transition-colors hover:bg-surface-subtle ${
        danger ? "text-danger" : "text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 border-t border-border" />;
}
