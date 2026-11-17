"use client";

import {
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { MobileCardItem, type MobileCardItemProps, type MobileCardField } from "./MobileCardItem";

export type ResponsiveBreakpoint = "sm" | "md" | "lg";

export interface ResponsiveTableColumn<T> {
  key?: string;
  header: ReactNode;
  accessor?: keyof T | ((item: T, index: number) => ReactNode);
  className?: string;
  headerClassName?: string;
  align?: "left" | "center" | "right";
}

export interface ResponsiveTableProps<T = any> {
  /** Colección de elementos a desplegar */
  items?: readonly T[];
  /** Definición de columnas para la vista de tabla desktop */
  columns?: ResponsiveTableColumn<T>[];
  /** Función que renderiza la tarjeta para la vista móvil de cada elemento */
  renderCard?: (item: T, index: number) => ReactNode;
  /** Extractor de key única para cada fila/tarjeta */
  keyExtractor?: (item: T, index: number) => string | number;

  /** Slot personalizado para la tabla en escritorio (anula columns/render automático) */
  desktop?: ReactNode;
  /** Slot personalizado para la lista en móvil (anula renderCard automático) */
  mobile?: ReactNode;

  /** Breakpoint en el que se produce la transición (default: "md" / 768px) */
  breakpoint?: ResponsiveBreakpoint;

  /** Texto accesible de caption para la tabla */
  caption?: string;
  /** Componente o mensaje cuando items está vacío */
  emptyState?: ReactNode;
  /** Pie de tabla o lista (resumen de registros, paginación, etc.) */
  footer?: ReactNode;

  /** Clases CSS para el contenedor raíz */
  className?: string;
  /** Clases CSS adicionales para el contenedor de la tabla desktop */
  desktopClassName?: string;
  /** Clases CSS adicionales para el contenedor de tarjetas móviles */
  mobileClassName?: string;
}

export interface ResponsiveTableDesktopProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  breakpoint?: ResponsiveBreakpoint;
  className?: string;
}

export interface ResponsiveTableMobileProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  breakpoint?: ResponsiveBreakpoint;
  className?: string;
}

export interface MobileCardListProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  gap?: "gap-2" | "gap-3" | "gap-4";
}

const desktopBreakpointClasses: Record<ResponsiveBreakpoint, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
};

const mobileBreakpointClasses: Record<ResponsiveBreakpoint, string> = {
  sm: "sm:hidden",
  md: "md:hidden",
  lg: "lg:hidden",
};

/**
 * ResponsiveTableDesktop
 *
 * Contenedor para la vista de escritorio de una tabla (oculto en móvil según breakpoint).
 */
export function ResponsiveTableDesktop({
  children,
  breakpoint = "md",
  className = "",
  ...rest
}: ResponsiveTableDesktopProps) {
  return (
    <div
      data-component="responsive-table-desktop"
      className={`${desktopBreakpointClasses[breakpoint]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveTableMobile
 *
 * Contenedor para la vista móvil de tarjetas/lista (oculto en escritorio según breakpoint).
 */
export function ResponsiveTableMobile({
  children,
  breakpoint = "md",
  className = "",
  ...rest
}: ResponsiveTableMobileProps) {
  return (
    <div
      data-component="responsive-table-mobile"
      className={`${mobileBreakpointClasses[breakpoint]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * MobileCardList
 *
 * Cuadrícula vertical de tarjetas para la vista móvil.
 */
export function MobileCardList({
  children,
  className = "",
  gap = "gap-3",
  ...rest
}: MobileCardListProps) {
  return (
    <div
      data-component="mobile-card-list"
      className={`grid ${gap} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * ResponsiveTable
 *
 * Componente unificado y estándar del Design System para renderizar tablas responsivas:
 * - En Desktop (>= 768px por defecto): Renderiza una tabla tradicional (<table>) con cabeceras, bordes y celdas.
 * - En Móvil (< 768px): Renderiza una lista vertical de tarjetas limpias (Cards) sin scroll horizontal.
 *
 * Soporta modo declarativo por datos (`items`, `columns`, `renderCard`) o modo por slots (`desktop`, `mobile`).
 */
export function ResponsiveTable<T = any>({
  items,
  columns,
  renderCard,
  keyExtractor,
  desktop,
  mobile,
  breakpoint = "md",
  caption,
  emptyState,
  footer,
  className = "",
  desktopClassName = "",
  mobileClassName = "",
}: ResponsiveTableProps<T>) {
  // Manejo de estado vacío
  if (items && items.length === 0 && emptyState) {
    return <div className={`w-full ${className}`}>{emptyState}</div>;
  }

  // Si se proveen slots explícitos (desktop y mobile), delegar directamente
  if (desktop || mobile) {
    return (
      <div data-component="responsive-table" className={`w-full ${className}`}>
        {desktop && (
          <ResponsiveTableDesktop
            breakpoint={breakpoint}
            className={desktopClassName}
          >
            {desktop}
          </ResponsiveTableDesktop>
        )}
        {mobile && (
          <ResponsiveTableMobile
            breakpoint={breakpoint}
            className={mobileClassName}
          >
            {mobile}
          </ResponsiveTableMobile>
        )}
      </div>
    );
  }

  const resolvedItems = items ?? [];
  const resolvedColumns = columns ?? [];

  // Renderizado data-driven por defecto
  return (
    <div data-component="responsive-table" className={`w-full ${className}`}>
      {/* Vista Desktop */}
      <ResponsiveTableDesktop
        breakpoint={breakpoint}
        className={desktopClassName}
      >
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              {caption && <caption className="sr-only">{caption}</caption>}
              <thead className="border-b border-[var(--border)] bg-[var(--surface-sunken)]">
                <tr>
                  {resolvedColumns.map((col, idx) => {
                    const alignClass =
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left";
                    return (
                      <th
                        key={col.key || idx}
                        scope="col"
                        className={`px-5 py-3.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)] ${alignClass} ${
                          col.headerClassName || ""
                        }`}
                      >
                        {col.header}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {resolvedItems.map((item, rowIdx) => {
                  const rowKey = keyExtractor
                    ? keyExtractor(item, rowIdx)
                    : (item as any)?.id ?? rowIdx;
                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-[var(--surface-elevated)]/60 transition-colors"
                    >
                      {resolvedColumns.map((col, colIdx) => {
                        const alignClass =
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left";
                        let content: ReactNode = null;
                        if (typeof col.accessor === "function") {
                          content = col.accessor(item, rowIdx);
                        } else if (col.accessor) {
                          content = (item as any)[col.accessor];
                        }
                        return (
                          <td
                            key={col.key || colIdx}
                            className={`px-5 py-4 text-sm text-[var(--foreground)] ${alignClass} ${
                              col.className || ""
                            }`}
                          >
                            {content}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {footer && (
            <footer className="border-t border-[var(--border)] px-5 py-3 font-mono text-xs text-[var(--muted)]">
              {footer}
            </footer>
          )}
        </div>
      </ResponsiveTableDesktop>

      {/* Vista Móvil */}
      <ResponsiveTableMobile
        breakpoint={breakpoint}
        className={mobileClassName}
      >
        <MobileCardList>
          {resolvedItems.map((item, idx) => {
            const cardKey = keyExtractor
              ? keyExtractor(item, idx)
              : (item as any)?.id ?? idx;
            return (
              <div key={cardKey}>
                {renderCard
                  ? renderCard(item, idx)
                  : (
                    <MobileCardItem
                      title={`Registro #${idx + 1}`}
                      fields={resolvedColumns.slice(0, 4).map((col) => ({
                        label: col.header,
                        value:
                          typeof col.accessor === "function"
                            ? col.accessor(item, idx)
                            : col.accessor
                            ? (item as any)[col.accessor]
                            : null,
                      }))}
                    />
                  )}
              </div>
            );
          })}
        </MobileCardList>
        {footer && (
          <div className="mt-3 px-2 py-2 text-center font-mono text-xs text-[var(--muted)]">
            {footer}
          </div>
        )}
      </ResponsiveTableMobile>
    </div>
  );
}

// Subcomponentes asignados para conveniencia y composición
ResponsiveTable.Desktop = ResponsiveTableDesktop;
ResponsiveTable.Mobile = ResponsiveTableMobile;
ResponsiveTable.Card = MobileCardItem;
ResponsiveTable.CardList = MobileCardList;

export { MobileCardItem, type MobileCardItemProps, type MobileCardField };
