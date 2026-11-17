"use client";

import {
  useState,
  useEffect,
  useCallback,
  useId,
  type ReactNode,
  type HTMLAttributes,
} from "react";

export type MobileFloatingActionVariant = "primary" | "default" | "danger";

export interface MobileFloatingActionItem {
  /** Identificador opcional de la acción */
  id?: string;
  /** Etiqueta de texto legible mostrada en la píldora junto al icono */
  label: string;
  /** Icono opcional de la acción secundaria */
  icon?: ReactNode;
  /** Acción a ejecutar al pulsar el botón (cierra automáticamente el menú) */
  onClick: () => void;
  /** Variante cromática del botón de acción secundaria */
  variant?: MobileFloatingActionVariant;
  /** Deshabilita la acción */
  disabled?: boolean;
  /** Subtítulo o descripción breve opcional */
  description?: string;
}

export type MobileFloatingAction = MobileFloatingActionItem;

export interface MobileFloatingActionMenuProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Lista de acciones contextuales a desplegar en el Speed-Dial */
  actions: MobileFloatingActionItem[];
  /** Etiqueta de accesibilidad para el botón disparador principal */
  ariaLabel?: string;
  /** Icono personalizado para el botón principal (por defecto '+') */
  icon?: ReactNode;
  /** Clases adicionales para el contenedor posicionado */
  className?: string;
  /** Clases de posicionamiento fijo personalizado (por defecto 'fixed bottom-24 right-4 z-30') */
  positionClassName?: string;
  /** Si es true (por defecto), se oculta en desktop mediante md:hidden */
  mobileOnly?: boolean;
  /** Estado controlado de apertura */
  open?: boolean;
  /** Alias de estado controlado de apertura */
  isOpen?: boolean;
  /** Estado inicial de apertura (modo no controlado) */
  defaultOpen?: boolean;
  /** Callback al cambiar el estado de apertura */
  onOpenChange?: (open: boolean) => void;
}

export type MobileFabDropdownProps = MobileFloatingActionMenuProps;

const defaultPlusIcon = (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const defaultActionIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const actionIconVariantClasses: Record<MobileFloatingActionVariant, string> = {
  primary:
    "bg-primary bg-[var(--primary)] text-primary-foreground text-[var(--primary-foreground)] border border-transparent",
  default:
    "bg-[var(--surface-elevated)] bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)]",
  danger: "bg-[var(--danger)] text-white border border-transparent",
};

/**
 * MobileFloatingActionMenu (Speed-Dial FAB / MobileFabDropdown)
 *
 * Botón de acción flotante (FAB) tipo Speed-Dial para vistas móviles (< 768px / md:hidden).
 * Posicionado en `fixed bottom-24 right-4 z-30` para despejar el BottomNav móvil (`bottom-16`).
 * - Estado cerrado: Botón circular primary (`w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg`) con icono '+'.
 * - Estado abierto: El icono '+' rota 45° (`rotate-45 transition-transform duration-200`) convirtiéndose en 'x',
 *   despliega un backdrop translúcido (`fixed inset-0 bg-black/40 backdrop-blur-xs z-20`) y eleva verticalmente
 *   la pila de acciones secundarias con etiqueta en píldora e icono.
 * - Cierra automáticamente al ejecutar una acción, pulsar el backdrop o presionar la tecla Escape.
 */
export function MobileFloatingActionMenu({
  actions,
  ariaLabel = "Acciones rápidas",
  icon,
  className = "",
  positionClassName = "fixed bottom-24 right-4 z-30",
  mobileOnly = true,
  open: controlledOpen,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  ...rest
}: MobileFloatingActionMenuProps) {
  const [internalOpen, setInternalOpen] = useState<boolean>(defaultOpen);
  const rawId = useId();
  const menuId = `mobile-fab-menu-${rawId.replace(/:/g, "")}`;

  const effectiveControlledOpen =
    controlledOpen !== undefined ? controlledOpen : controlledIsOpen;
  const isOpen =
    effectiveControlledOpen !== undefined
      ? effectiveControlledOpen
      : internalOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (effectiveControlledOpen === undefined) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [effectiveControlledOpen, onOpenChange],
  );

  const closeMenu = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const toggleMenu = useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  if (!actions || actions.length === 0) {
    return null;
  }

  const responsiveVisibilityClass = mobileOnly ? "md:hidden" : "";

  return (
    <>
      {isOpen && (
        <div
          data-component="mobile-fab-backdrop"
          aria-hidden="true"
          onClick={closeMenu}
          className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-20 transition-opacity duration-200 ${responsiveVisibilityClass}`}
        />
      )}

      <div
        data-component="mobile-floating-action-menu"
        data-state={isOpen ? "open" : "closed"}
        onKeyDown={(e) => {
          if (e.key === "Escape" && isOpen) {
            e.stopPropagation();
            closeMenu();
          }
        }}
        className={`${positionClassName} flex flex-col items-end gap-3 ${responsiveVisibilityClass} ${className}`.trim()}
        {...rest}
      >
        {isOpen && (
          <div
            id={menuId}
            role="menu"
            aria-label={ariaLabel}
            data-component="mobile-fab-actions"
            className="flex flex-col items-end gap-2.5 mb-0.5 transition-all duration-200"
          >
            {actions.map((action, index) => {
              const itemKey = action.id ?? `${action.label}-${index}`;
              const variant = action.variant ?? "default";
              const iconClasses = actionIconVariantClasses[variant];

              return (
                <button
                  key={itemKey}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  data-component="mobile-fab-action-item"
                  data-variant={variant}
                  onClick={() => {
                    if (action.disabled) return;
                    closeMenu();
                    action.onClick();
                  }}
                  className="group flex items-center justify-end gap-2.5 cursor-pointer focus:outline-none disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span
                    data-component="mobile-fab-action-label"
                    className="px-3.5 py-2 rounded-xl bg-[var(--surface-elevated)] bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-xs sm:text-sm font-display font-semibold shadow-md whitespace-nowrap transition-transform duration-150 group-hover:scale-[1.02] group-active:scale-95"
                  >
                    {action.label}
                    {action.description && (
                      <span className="block text-[10px] font-normal text-[var(--muted)]">
                        {action.description}
                      </span>
                    )}
                  </span>

                  <span
                    data-component="mobile-fab-action-icon"
                    aria-hidden="true"
                    className={`w-11 h-11 rounded-full shadow-md flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 group-active:scale-95 ${iconClasses}`}
                  >
                    {action.icon ?? defaultActionIcon}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={isOpen ? menuId : undefined}
          data-component="mobile-fab-trigger"
          onClick={toggleMenu}
          className="w-14 h-14 rounded-full bg-primary bg-[var(--primary)] text-primary-foreground text-[var(--primary-foreground)] shadow-lg flex items-center justify-center hover:opacity-95 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 focus:ring-offset-2"
        >
          <span
            data-component="mobile-fab-icon"
            aria-hidden="true"
            className={`flex items-center justify-center ${
              isOpen
                ? "rotate-45 transition-transform duration-200"
                : "rotate-0 transition-transform duration-200"
            }`}
          >
            {icon ?? defaultPlusIcon}
          </span>
        </button>
      </div>
    </>
  );
}

// Alias semántico requerido por especificación
export const MobileFabDropdown = MobileFloatingActionMenu;
