"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export type PullToRefreshState = "idle" | "pulling" | "ready" | "refreshing";

export interface UsePullToRefreshOptions {
  /** Acción asíncrona o síncrona a ejecutar al soltar en estado listo */
  onRefresh: () => Promise<void> | void;
  /** Distancia en px requerida para disparar la actualización (por defecto: 64) */
  threshold?: number;
  /** Distancia máxima de desplazamiento visual con amortiguación (por defecto: 120) */
  maxPullDistance?: number;
  /** Deshabilita los gestos touch */
  disabled?: boolean;
  /** Estado de refresco controlado externamente */
  isRefreshing?: boolean;
}

export interface UsePullToRefreshReturn {
  pullDistance: number;
  state: PullToRefreshState;
  isRefreshing: boolean;
  /** Progreso de 0 a 1 respecto al threshold */
  progress: number;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
    onTouchCancel: () => void;
  };
  triggerRefresh: () => Promise<void>;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 64,
  maxPullDistance = 120,
  disabled = false,
  isRefreshing: controlledRefreshing,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [internalRefreshing, setInternalRefreshing] = useState(false);
  const isRefreshing = controlledRefreshing !== undefined ? controlledRefreshing : internalRefreshing;

  const [pullDistance, setPullDistance] = useState(0);
  const [state, setState] = useState<PullToRefreshState>("idle");

  const startYRef = useRef<number | null>(null);
  const startXRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  // Sincronizar estado cuando el refresco controlado termina o inicia
  useEffect(() => {
    if (isRefreshing) {
      setState("refreshing");
      setPullDistance(threshold);
    } else if (state === "refreshing") {
      setState("idle");
      setPullDistance(0);
    }
  }, [isRefreshing, threshold]);

  const triggerRefresh = useCallback(async () => {
    if (disabled || isRefreshing) return;
    try {
      setState("refreshing");
      setPullDistance(threshold);
      if (controlledRefreshing === undefined) {
        setInternalRefreshing(true);
      }
      await onRefresh();
    } finally {
      if (controlledRefreshing === undefined) {
        setInternalRefreshing(false);
      }
      setState("idle");
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, onRefresh, threshold, controlledRefreshing]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing) return;

      // Verificar que estemos en la parte superior del scroll (window o elemento)
      const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
      const targetElement = e.currentTarget as HTMLElement | null;
      const elementScrollTop = targetElement ? targetElement.scrollTop : 0;

      if (scrollY > 0 || elementScrollTop > 0) {
        isPullingRef.current = false;
        startYRef.current = null;
        startXRef.current = null;
        return;
      }

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isPullingRef.current = true;
    },
    [disabled, isRefreshing]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !isPullingRef.current || startYRef.current === null || startXRef.current === null) {
        return;
      }

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;

      const deltaY = currentY - startYRef.current;
      const deltaX = Math.abs(currentX - startXRef.current);

      // Si el usuario desplaza hacia abajo y predomina el movimiento vertical sobre el horizontal
      if (deltaY > 0 && deltaY > deltaX) {
        // Amortiguación: resistencia elástica de 0.5 limitada a maxPullDistance
        const damped = Math.min(deltaY * 0.5, maxPullDistance);
        setPullDistance(damped);

        if (damped >= threshold) {
          setState("ready");
        } else {
          setState("pulling");
        }
      } else if (deltaY <= 0) {
        setPullDistance(0);
        setState("idle");
      }
    },
    [disabled, isRefreshing, maxPullDistance, threshold]
  );

  const resetPull = useCallback(() => {
    isPullingRef.current = false;
    startYRef.current = null;
    startXRef.current = null;
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPullingRef.current) {
      resetPull();
      return;
    }

    resetPull();

    if (state === "ready" || pullDistance >= threshold) {
      await triggerRefresh();
    } else {
      setState("idle");
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, state, pullDistance, threshold, triggerRefresh, resetPull]);

  const onTouchCancel = useCallback(() => {
    resetPull();
    if (!isRefreshing) {
      setState("idle");
      setPullDistance(0);
    }
  }, [resetPull, isRefreshing]);

  const progress = Math.min(Math.max(pullDistance / threshold, 0), 1);

  return {
    pullDistance,
    state,
    isRefreshing,
    progress,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel,
    },
    triggerRefresh,
  };
}
