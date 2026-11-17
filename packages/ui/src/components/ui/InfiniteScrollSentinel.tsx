"use client";

import {
  type ReactNode,
  type HTMLAttributes,
  useRef,
} from "react";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

export interface InfiniteScrollSentinelProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Callback para solicitar la siguiente página (si se delega al componente el IntersectionObserver) */
  onLoadMore?: () => void | Promise<void>;
  /** Indica si hay más registros pendientes por cargar */
  hasMore?: boolean;
  /** Estado de carga de la página siguiente */
  isLoadingMore?: boolean;
  /** Estado de carga general o inicial */
  isLoading?: boolean;
  /** Ref externa generada por useInfiniteScroll si el hook se ejecutó en el padre */
  sentinelRef?: React.Ref<HTMLDivElement> | ((node: HTMLElement | null) => void);
  /** Margen anticipado del viewport (default: '200px') */
  rootMargin?: string;
  /** Umbral de visibilidad del observer (default: 0) */
  threshold?: number | number[];
  /** Mensaje de carga personalizado durante el fetch de páginas posteriores */
  loadingMessage?: ReactNode;
  /** Mensaje final cuando se alcanza el fin del catálogo */
  endMessage?: ReactNode;
  /** Total de registros para mostrar resumen al llegar al final */
  total?: number;
  /** Cantidad actual mostrada */
  currentCount?: number;
  /** Si está deshabilitado */
  disabled?: boolean;
  className?: string;
}

/**
 * InfiniteScrollSentinel
 *
 * Componente visual y funcional de Centinela para Scroll Infinito.
 * Renderiza:
 * 1. Spinner discreto animado y texto durante la carga de páginas siguientes (`isLoadingMore`).
 * 2. Indicador sutil de fin de lista (`endMessage`) cuando no hay más registros (`!hasMore`).
 * 3. Enlaza automáticamente el IntersectionObserver si se pasa `onLoadMore`, o acepta una ref externa.
 */
export function InfiniteScrollSentinel({
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  isLoading = false,
  sentinelRef: externalSentinelRef,
  rootMargin = "200px",
  threshold = 0,
  loadingMessage,
  endMessage,
  total,
  currentCount,
  disabled = false,
  className = "",
  style,
  ...rest
}: InfiniteScrollSentinelProps) {
  // Hook interno si se proveyó onLoadMore directamente en el componente
  const internalHook = useInfiniteScroll({
    onLoadMore: onLoadMore ?? (() => {}),
    hasMore,
    isLoading,
    isLoadingMore,
    rootMargin,
    threshold,
    disabled: disabled || !onLoadMore,
  });

  const localDivRef = useRef<HTMLDivElement | null>(null);

  // Combinar refs si se provee una externa o interna
  const combinedRef = (node: HTMLDivElement | null) => {
    localDivRef.current = node;
    if (onLoadMore) {
      internalHook.sentinelRef(node);
    }
    if (typeof externalSentinelRef === "function") {
      externalSentinelRef(node);
    } else if (externalSentinelRef && "current" in externalSentinelRef) {
      (externalSentinelRef as any).current = node;
    }
  };

  const showLoading = isLoadingMore;
  const showEnd = !hasMore && !isLoadingMore && !isLoading && (currentCount === undefined || currentCount > 0);

  return (
    <div
      ref={combinedRef}
      data-component="infinite-scroll-sentinel"
      role="status"
      aria-live="polite"
      className={`py-4 flex flex-col items-center justify-center gap-2 min-h-[48px] select-none text-center ${className}`}
      style={style}
      {...rest}
    >
      {showLoading && (
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
          <div
            className="w-4 h-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin shrink-0"
            aria-hidden="true"
          />
          <span>{loadingMessage ?? "Cargando más registros…"}</span>
        </div>
      )}

      {showEnd && (
        <p className="text-[11px] font-mono text-[var(--muted)] opacity-60">
          {endMessage ?? (
            total !== undefined && currentCount !== undefined
              ? `Has llegado al final del catálogo (${currentCount} de ${total} registros)`
              : "Has llegado al final de los registros"
          )}
        </p>
      )}
    </div>
  );
}
