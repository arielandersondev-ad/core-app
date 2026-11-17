"use client";

import React from "react";
import {
  usePullToRefresh,
  type UsePullToRefreshOptions,
} from "../../hooks/usePullToRefresh";

export interface PullToRefreshProps extends UsePullToRefreshOptions {
  children: React.ReactNode;
  pullingLabel?: string;
  readyLabel?: string;
  refreshingLabel?: string;
  className?: string;
}

/**
 * Componente PullToRefresh
 * Contenedor interactivo táctil para vistas móviles con indicador visual
 * de amortiguación, rotación de icono y spinner de recarga.
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 64,
  maxPullDistance = 120,
  disabled = false,
  isRefreshing: controlledRefreshing,
  pullingLabel = "Desliza para actualizar",
  readyLabel = "Suelta para actualizar",
  refreshingLabel = "Actualizando...",
  className = "",
}: PullToRefreshProps) {
  const { pullDistance, state, isRefreshing, progress, handlers } =
    usePullToRefresh({
      onRefresh,
      threshold,
      maxPullDistance,
      disabled,
      isRefreshing: controlledRefreshing,
    });

  const isVisible = pullDistance > 0 || isRefreshing;

  return (
    <div
      data-testid="pull-to-refresh"
      {...handlers}
      className={`relative w-full h-full overflow-hidden ${className}`}
    >
      {/* Indicador animado superior */}
      <div
        role="status"
        aria-live="polite"
        style={{
          height: `${pullDistance}px`,
          transform: isVisible ? "translateY(0)" : "translateY(-100%)",
        }}
        className={`w-full flex items-center justify-center overflow-hidden transition-[height] ${
          state === "refreshing" ? "duration-200" : "duration-75"
        }`}
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] shadow-xs text-xs font-medium text-[var(--muted)]">
          {/* Icono de flecha o spinner */}
          {state === "refreshing" ? (
            <svg
              className="w-4 h-4 animate-spin text-[var(--primary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          ) : (
            <svg
              className={`w-4 h-4 text-[var(--primary)] transition-transform duration-200 ${
                state === "ready" ? "rotate-180" : "rotate-0"
              }`}
              style={{
                transform:
                  state === "ready"
                    ? "rotate(180deg)"
                    : `rotate(${progress * 180}deg)`,
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          )}

          {/* Etiqueta de estado */}
          <span className="font-sans text-[var(--foreground)]">
            {state === "refreshing"
              ? refreshingLabel
              : state === "ready"
                ? readyLabel
                : pullingLabel}
          </span>
        </div>
      </div>

      {/* Contenido hijo */}
      <div className="relative w-full h-full">{children}</div>
    </div>
  );
}
