"use client";

import { type ReactNode, type HTMLAttributes } from "react";

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  sticky?: boolean;
  className?: string;
}

/**
 * ModalFooter
 *
 * Componente de pie estandarizado para Modal, BottomSheet y ResponsiveModal con soporte
 * de anclaje 'sticky bottom'. Mantiene los botones de acción principales (Guardar / Cancelar)
 * siempre visibles y fijos al fondo del viewport sin requerir scroll por parte del usuario.
 */
export function ModalFooter({
  children,
  sticky = true,
  className = "",
  style,
  ...rest
}: ModalFooterProps) {
  const stickyClasses = sticky
    ? "sticky bottom-0 z-20 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 px-4 py-3 sm:px-6 sm:py-4 bg-[var(--surface-elevated)]/95 backdrop-blur-xs border-t border-[var(--border)] mt-auto"
    : "px-4 py-3 sm:px-6 sm:py-4 border-t border-[var(--border)] bg-[var(--surface)] mt-auto";

  return (
    <div
      data-component="modal-footer"
      className={`${stickyClasses} flex items-center justify-end gap-3 shrink-0 ${className}`}
      style={{
        paddingBottom: sticky ? "max(env(safe-area-inset-bottom, 0px), 0.875rem)" : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
