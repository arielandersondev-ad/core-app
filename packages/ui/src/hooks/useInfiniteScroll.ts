"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface UseInfiniteScrollOptions {
  /** Callback invocado cuando el centinela entra en el viewport */
  onLoadMore: () => void | Promise<void>;
  /** Indica si existen más páginas o registros por cargar */
  hasMore: boolean;
  /** Estado de carga inicial o general */
  isLoading?: boolean;
  /** Estado de carga específico de la siguiente página */
  isLoadingMore?: boolean;
  /** Margen del viewport para anticipar la carga antes de llegar al final (default: '200px') */
  rootMargin?: string;
  /** Umbral de visibilidad de 0 a 1 (default: 0) */
  threshold?: number | number[];
  /** Si el observer está deshabilitado temporalmente */
  disabled?: boolean;
}

export interface UseInfiniteScrollReturn {
  /** Ref callback que puede adjuntarse a cualquier elemento JSX como centinela */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Ref estándar como MutableRefObject */
  targetRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * useInfiniteScroll
 *
 * Hook estandarizado para Scroll Infinito basado en IntersectionObserver.
 * Encapsula la detección de proximidad al fondo con rootMargin anticipado (default 200px),
 * control estricto de concurrencia contra re-triggers dobles, desconexión limpia en unmount
 * y soporte seguro para entornos SSR.
 */
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading = false,
  isLoadingMore = false,
  rootMargin = "200px",
  threshold = 0,
  disabled = false,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const isTriggeringRef = useRef(false);

  // Callback ref para enlazar cualquier elemento DOM incluso si se monta condicionalmente
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    targetRef.current = node as HTMLDivElement | null;
    setTargetNode(node);
  }, []);

  // Mantener referencias actualizadas de las props para el observer sin recrearlo constantemente
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;

  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    // Si estamos en SSR o IntersectionObserver no existe, salir sin error
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const node = targetNode || targetRef.current;
    if (!node || disabled) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        const [entry] = entries;
        if (
          entry &&
          entry.isIntersecting &&
          hasMoreRef.current &&
          !isLoadingRef.current &&
          !isLoadingMoreRef.current &&
          !disabledRef.current &&
          !isTriggeringRef.current
        ) {
          isTriggeringRef.current = true;
          try {
            const result = onLoadMoreRef.current();
            if (result instanceof Promise) {
              await result;
            }
          } finally {
            // Permitir nuevo trigger en el siguiente ciclo de render
            isTriggeringRef.current = false;
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [targetNode, rootMargin, threshold, disabled]);

  return {
    sentinelRef,
    targetRef,
  };
}
