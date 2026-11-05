"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { DEV_PERSONAS, type DevPersona } from "../types/personas";
import { switchPersonaAction } from "../actions/switch-persona.action";

interface DevPersonaSwitcherProps {
  currentPersonaId?: string | null;
}

export function DevPersonaSwitcher({ currentPersonaId }: DevPersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activePersonaId, setActivePersonaId] = useState<string | null>(currentPersonaId ?? null);
  const pathname = usePathname();

  // Drag and drop state
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    hasMoved: boolean;
    btnWidth: number;
    btnHeight: number;
  } | null>(null);

  const asideRef = useRef<HTMLElement>(null);

  const currentPersona: DevPersona | undefined = activePersonaId
    ? DEV_PERSONAS[activePersonaId]
    : undefined;

  const handleSelect = (personaId: string) => {
    setActivePersonaId(personaId === "logout" ? null : personaId);
    startTransition(async () => {
      await switchPersonaAction(personaId, pathname);
      setIsOpen(false);
    });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only drag with primary mouse button
    if (e.button !== 0) return;

    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);
    const rect = btn.getBoundingClientRect();

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      hasMoved: false,
      btnWidth: rect.width,
      btnHeight: rect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;

    const { startX, startY, offsetX, offsetY, btnWidth, btnHeight } = dragRef.current;
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (dist > 4) {
      dragRef.current.hasMoved = true;
      setIsDragging(true);

      const maxX = Math.max(10, window.innerWidth - btnWidth - 10);
      const maxY = Math.max(10, window.innerHeight - btnHeight - 10);

      const nextX = Math.max(10, Math.min(maxX, e.clientX - offsetX));
      const nextY = Math.max(10, Math.min(maxY, e.clientY - offsetY));

      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const { hasMoved } = dragRef.current;
    dragRef.current = null;
    setIsDragging(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (!hasMoved) {
      setIsOpen((prev) => !prev);
    }
  };

  // Determine popover orientation based on position
  const isNearTop = position ? position.y < 380 : false;
  const isNearLeft = position ? position.x < 360 : false;

  return (
    <aside
      ref={asideRef}
      aria-label="Dev Persona Switcher"
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: "auto",
              right: "auto",
            }
          : undefined
      }
      className={`fixed ${
        position ? "" : "bottom-4 right-4"
      } z-[9999] font-sans text-xs select-none touch-none`}
    >
      {/* Popover desplegable con opciones */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Panel de Simulación de Roles y Personas"
          className={`${
            isNearTop ? "mt-2" : "mb-2"
          } w-80 sm:w-88 bg-[var(--surface,#ffffff)] dark:bg-[#18181b] border-2 border-[var(--border,#e4e4e7)] dark:border-[#27272a] rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-scale-in flex flex-col gap-3 ${
            isNearLeft ? "origin-top-left" : "origin-bottom-right"
          }`}
          style={{
            position: isNearTop ? "relative" : "absolute",
            bottom: isNearTop ? "auto" : "100%",
            right: isNearLeft ? "auto" : 0,
            left: isNearLeft ? 0 : "auto",
          }}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b border-[var(--border,#e4e4e7)] dark:border-[#27272a] pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                  DEV MODE
                </span>
                <span className="font-semibold text-sm text-[var(--foreground,#09090b)] dark:text-[#fafafa]">
                  Persona Switcher
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted,#71717a)] mt-0.5">
                Acceso en 1-clic con tokens RS256 reales · Arrastra para mover
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--surface-subtle,#f4f4f5)] dark:hover:bg-[#27272a] text-[var(--muted,#71717a)] hover:text-[var(--foreground,#09090b)] hover:rotate-90 hover:scale-110 active:scale-90 transition-all duration-150 cursor-pointer"
              aria-label="Cerrar panel"
            >
              ✕
            </button>
          </div>

          {/* Lista de Personas */}
          <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-0.5">
            {Object.values(DEV_PERSONAS).map((persona) => {
              const isCurrent = currentPersona?.id === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSelect(persona.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all duration-150 hover:translate-x-1 active:scale-98 relative ${
                    isCurrent
                      ? "bg-emerald-500/10 border-emerald-500/40 text-[var(--foreground,#09090b)] dark:text-[#fafafa] shadow-xs"
                      : "bg-[var(--background,#ffffff)] dark:bg-[#18181b] border-[var(--border,#e4e4e7)] dark:border-[#27272a] hover:border-emerald-500/40 hover:bg-[var(--surface-subtle,#f4f4f5)] dark:hover:bg-[#27272a]/70 text-[var(--foreground,#09090b)] dark:text-[#e4e4e7]"
                  } disabled:opacity-60 cursor-pointer`}
                >
                  <div className="text-xl shrink-0 mt-0.5 transition-transform duration-150 group-hover:scale-110">{persona.avatarIcon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs truncate">
                        {persona.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${persona.badgeClass}`}
                      >
                        {persona.badgeLabel}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--muted,#71717a)] mt-0.5 line-clamp-1">
                      {persona.roleTitle} — {persona.description}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 self-center animate-gentle-pulse" title="Sesión activa" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Acciones inferiores */}
          <div className="flex items-center justify-between border-t border-[var(--border,#e4e4e7)] dark:border-[#27272a] pt-2.5 text-[11px]">
            {currentPersona ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(currentPersona.id)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
              >
                🔄 Renovar sesión (30m)
              </button>
            ) : (
              <span className="text-[var(--muted,#71717a)]">Sin sesión activa</span>
            )}

            <button
              type="button"
              disabled={isPending}
              onClick={() => handleSelect("logout")}
              className="text-red-600 dark:text-red-400 hover:underline font-medium disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform duration-150 cursor-pointer"
            >
              🚪 Cerrar sesión
            </button>
          </div>

          {isPending && (
            <div className="text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-mono animate-pulse">
              Emite token RS256 y actualiza sesión…
            </div>
          )}
        </div>
      )}

      {/* Pill flotante principal con soporte de Drag & Drop */}
      <button
        type="button"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          setIsDragging(false);
        }}
        disabled={isPending}
        title="Arrastra para mover a cualquier parte de la pantalla · Clic para abrir"
        className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 shadow-lg backdrop-blur-md transition-shadow duration-150 ${
          isDragging ? "cursor-grabbing shadow-2xl scale-105" : "cursor-grab hover:scale-105 hover:shadow-xl active:scale-95"
        } ${
          currentPersona
            ? "bg-[var(--surface,#ffffff)] dark:bg-[#18181b] border-emerald-500/50 text-[var(--foreground,#09090b)] dark:text-[#fafafa] hover:border-emerald-500"
            : "bg-[var(--surface,#ffffff)] dark:bg-[#18181b] border-amber-500/50 text-[var(--foreground,#09090b)] dark:text-[#fafafa] hover:border-amber-500"
        }`}
      >
        {/* Grip indicator */}
        <span className="text-[10px] text-[var(--muted,#71717a)] opacity-60 font-mono -mr-0.5" aria-hidden="true">
          ⋮⋮
        </span>
        <span className="w-2 h-2 rounded-full animate-pulse shrink-0 bg-emerald-500" />
        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[var(--muted,#71717a)]">
          DEV
        </span>
        <span className="font-semibold text-xs flex items-center gap-1 max-w-[160px] truncate">
          {currentPersona ? (
            <>
              <span>{currentPersona.avatarIcon}</span>
              <span className="truncate">{currentPersona.name}</span>
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400">Sin autenticar</span>
          )}
        </span>
        <span className="text-[10px] text-[var(--muted,#71717a)]">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>
    </aside>
  );
}
