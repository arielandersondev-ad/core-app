"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavItemActive, navItemsForPlan } from "./navigation";
import { useAuthenticatedSession } from "@/infrastructure/auth/authenticated-session";
import styles from "./bottom-nav.module.css";

/** Lo que tarda la burbuja en hundirse (ver bottom-nav.module.css). */
const SINK_MS = 260;
/** Si la navegación no llega (cancelada o fallida), la burbuja vuelve a su sitio. */
const STUCK_MS = 4000;

/**
 * Barra inferior móvil (< 768 px). La sección activa se muestra solo con su
 * icono, en una burbuja que se despega de la barra: la barra abre un hueco con
 * un pequeño margen alrededor (máscara en bottom-nav.module.css).
 *
 * Al elegir otra sección la burbuja se hunde en la barra y su icono vuelve a
 * ella; cuando la nueva página ya está lista (cambia el pathname), la burbuja
 * pasa a la nueva posición y emerge. Así no hay un deslizamiento que se quede
 * esperando a la página.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { plan } = useAuthenticatedSession();
  const visibleItems = navItemsForPlan(plan).filter((item) => item.showInBottomNav !== false);
  const activeIndex = visibleItems.findIndex(({ href }) => isNavItemActive(pathname, href));

  // Posición donde está (o estará) la burbuja; va por detrás de activeIndex durante la transición.
  const [shownIndex, setShownIndex] = useState(activeIndex);
  const [bubbleUp, setBubbleUp] = useState(activeIndex >= 0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const sinkStartedAt = useRef<number | null>(null);

  // `timeStamp` del evento usa el mismo reloj que performance.now().
  const startSinking = (index: number, at: number) => {
    if (index === activeIndex) return;
    sinkStartedAt.current = at;
    setPendingIndex(index);
    setBubbleUp(false);
  };

  // 1-2. La página nueva ya está: se termina de hundir y la burbuja salta a su nueva posición.
  useEffect(() => {
    if (activeIndex === shownIndex) return;
    // Sin toque previo (atrás/adelante o un enlace fuera de la barra) primero se hunde.
    const wasSinking = sinkStartedAt.current !== null;
    const remaining = wasSinking
      ? Math.max(0, SINK_MS - (performance.now() - (sinkStartedAt.current ?? 0)))
      : SINK_MS;
    const sinkTimer = wasSinking ? undefined : setTimeout(() => setBubbleUp(false), 0);
    const moveTimer = setTimeout(() => {
      sinkStartedAt.current = null;
      setPendingIndex(null);
      setShownIndex(activeIndex);
    }, remaining);
    return () => {
      clearTimeout(sinkTimer);
      clearTimeout(moveTimer);
    };
  }, [activeIndex, shownIndex]);

  // 3. Ya en su nueva posición, emerge (dos frames para que el navegador pinte el estado hundido).
  useEffect(() => {
    if (shownIndex < 0 || sinkStartedAt.current !== null) return;
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setBubbleUp(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [shownIndex]);

  useEffect(() => {
    if (pendingIndex === null) return;
    const timer = setTimeout(() => {
      sinkStartedAt.current = null;
      setPendingIndex(null);
      setBubbleUp(true);
    }, STUCK_MS);
    return () => clearTimeout(timer);
  }, [pendingIndex]);

  const shownItem = shownIndex >= 0 ? visibleItems[shownIndex] : undefined;
  const notchX = shownItem ? ((shownIndex + 0.5) / visibleItems.length) * 100 : 50;

  return (
    <nav
      aria-label="Navegación móvil"
      data-notched={shownItem ? "true" : "false"}
      data-bubble={shownItem && bubbleUp ? "up" : "down"}
      style={{ "--notch-x": `${notchX}%` } as CSSProperties}
      className={`${styles.nav} fixed inset-x-0 bottom-0 z-40 md:hidden`}
    >
      <div
        aria-hidden="true"
        className={`${styles.surface} absolute inset-0 border-t border-border-strong/45 bg-linear-to-b from-surface-elevated/86 to-surface-elevated/96 backdrop-blur-xl backdrop-saturate-150`}
      />

      {shownItem && (
        <span
          aria-hidden="true"
          className={`${styles.bubble} pointer-events-none grid place-items-center rounded-full bg-linear-to-br from-primary to-[color-mix(in_oklab,var(--primary)_72%,var(--primary-accent))] text-primary-foreground shadow-[0_8px_18px_-6px_color-mix(in_oklab,var(--primary)_60%,transparent)] [&_svg]:size-6`}
        >
          {shownItem.icon}
        </span>
      )}

      <ul className="relative box-content flex h-16 pb-[env(safe-area-inset-bottom)]">
        {visibleItems.map(({ section, label, href, icon }, index) => {
          const inBubble = index === shownIndex && bubbleUp;
          const pending = index === pendingIndex;
          return (
            <li key={section} className="flex flex-1">
              <Link
                href={href}
                onClick={(event) => startSinking(index, event.timeStamp)}
                aria-current={index === activeIndex ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50 active:scale-95 motion-reduce:active:scale-100 ${
                  pending ? "text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {inBubble ? (
                  // El icono activo se pinta en la burbuja; aquí solo queda el nombre para lectores de pantalla.
                  <span className="sr-only">{label}</span>
                ) : (
                  <span className="flex min-w-0 max-w-full flex-col items-center gap-1">
                    <span aria-hidden="true" className="[&_svg]:size-[22px]">{icon}</span>
                    <span className={`max-w-full truncate px-1 text-[11px] leading-none ${pending ? "font-semibold" : "font-medium"}`}>
                      {label}
                    </span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
