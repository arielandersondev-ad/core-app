"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";

export type BottomSheetSnapPoint = "auto" | "compact" | "half" | "full";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: ReactNode;
  snapPoint?: BottomSheetSnapPoint;
  showHandle?: boolean;
  showCloseButton?: boolean;
  dismissOnBackdrop?: boolean;
  dismissOnSwipe?: boolean;
  headerAction?: ReactNode;
  footer?: ReactNode;
  footerSticky?: boolean;
  footerClassName?: string;
  maxWidth?: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl";
  children: ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  eyebrow,
  icon,
  snapPoint = "auto",
  showHandle = true,
  showCloseButton = true,
  dismissOnBackdrop = true,
  dismissOnSwipe = true,
  headerAction,
  footer,
  footerSticky = true,
  footerClassName = "",
  maxWidth = "max-w-xl",
  children,
  className = "",
}: BottomSheetProps) {
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartTime, setDragStartTime] = useState<number>(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // Historial de navegador (Back en móvil / popstate)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pushedHistoryRef = useRef(false);
  const closedByPopStateRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined" || typeof window.history?.pushState !== "function") return;

    window.history.pushState(
      { ...(window.history.state || {}), __bottomSheet: true },
      ""
    );
    pushedHistoryRef.current = true;
    closedByPopStateRef.current = false;

    const handlePopState = () => {
      closedByPopStateRef.current = true;
      pushedHistoryRef.current = false;
      onCloseRef.current();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (pushedHistoryRef.current && !closedByPopStateRef.current) {
        pushedHistoryRef.current = false;
        if (window.history.state?.__bottomSheet) {
          window.history.back();
        }
      }
    };
  }, [open]);

  // Esc key and scroll lock
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Touch gesture handlers for drag-down dismissal
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!dismissOnSwipe) return;
    // Only initiate swipe if content is at the top
    if (contentRef.current && contentRef.current.scrollTop > 5) return;

    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
    setDragStartTime(Date.now());
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isDragging || touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;

    // Only allow pulling down (positive delta)
    if (deltaY > 0) {
      setTouchCurrentY(currentY);
      // Prevent default scrolling when pulling sheet down
      if (e.cancelable) e.preventDefault();
    } else {
      setTouchCurrentY(touchStartY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || touchStartY === null || touchCurrentY === null) {
      setIsDragging(false);
      setTouchStartY(null);
      setTouchCurrentY(null);
      return;
    }

    const deltaY = touchCurrentY - touchStartY;
    const duration = Date.now() - dragStartTime;
    const velocity = deltaY / (duration || 1); // px per ms

    // Close if pulled down > 90px or swiped fast down (> 0.5px/ms with at least 30px move)
    if (deltaY > 90 || (velocity > 0.5 && deltaY > 30)) {
      onClose();
    }

    setIsDragging(false);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  if (!open) return null;

  const currentTranslateY =
    isDragging && touchStartY !== null && touchCurrentY !== null
      ? Math.max(0, touchCurrentY - touchStartY)
      : 0;

  const snapPointClasses: Record<BottomSheetSnapPoint, string> = {
    compact: "max-h-[48vh]",
    half: "max-h-[65vh]",
    auto: "max-h-[88vh]",
    full: "h-[94vh] max-h-[94vh]",
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-component="bottom-sheet"
      aria-label={title || "Panel inferior"}
      className="fixed inset-0 z-[9999] flex flex-col justify-end items-center sm:p-0 overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
      }}
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs animate-fade-in transition-opacity duration-200"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
        }}
        onClick={dismissOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Sheet Container */}
      <div
        className={`relative z-10 w-full ${maxWidth} bg-[var(--surface-elevated)] border-t sm:border border-[var(--border)] rounded-t-3xl sm:rounded-t-2xl sm:rounded-b-none overflow-hidden shadow-2xl flex flex-col ${snapPointClasses[snapPoint]} ${className}`}
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          transform: `translateY(${currentTranslateY}px)`,
          transition: isDragging
            ? "none"
            : "transform 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle Indicator */}
        {showHandle && (
          <div
            className="w-full pt-3 pb-1.5 flex items-center justify-center cursor-grab active:cursor-grabbing select-none shrink-0"
            aria-hidden="true"
          >
            <div className="w-12 h-1.5 rounded-full bg-[var(--border)] hover:bg-[var(--muted)] transition-colors duration-150" />
          </div>
        )}

        {/* Header */}
        {(title || eyebrow || icon || showCloseButton || headerAction) && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-[var(--border)]/70 bg-[var(--surface)] shrink-0 gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {icon && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center shrink-0">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {eyebrow && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--primary)] font-semibold truncate">
                    {eyebrow}
                  </p>
                )}
                {title && (
                  <h2 className="font-display font-bold text-[var(--foreground)] text-sm sm:text-base leading-tight truncate">
                    {title}
                  </h2>
                )}
                {subtitle && (
                  <p className="text-[11px] sm:text-xs text-[var(--muted)] mt-0.5 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerAction}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--neutral-subtle)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                  aria-label="Cerrar panel"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Body */}
        <div
          ref={contentRef}
          className="px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1 overscroll-contain"
        >
          {children}
        </div>

        {/* Optional Sticky Footer */}
        {footer && (
          <div
            data-component="bottom-sheet-base-footer"
            className={`${
              footerSticky
                ? "sticky bottom-0 z-20 bg-[var(--surface-elevated)]/95 backdrop-blur-xs"
                : "bg-[var(--surface)]"
            } px-4 py-3 sm:px-6 sm:py-3.5 border-t border-[var(--border)]/70 shrink-0 ${footerClassName}`}
            style={{
              paddingBottom: footerSticky
                ? "max(env(safe-area-inset-bottom, 0px), 0.875rem)"
                : undefined,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
