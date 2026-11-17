"use client";

import { type ReactNode } from "react";
import { useIsMobile } from "../../hooks/useIsMobile";
import { Modal, type ModalProps } from "./Modal";
import { BottomSheet, type BottomSheetSnapPoint } from "./BottomSheet";
export { ModalFooter, type ModalFooterProps } from "./ModalFooter";

export interface ResponsiveModalProps {
  /** Controls visibility of the dialog */
  open: boolean;
  /** Callback fired when user requests close (ESC, backdrop, close button, swipe) */
  onClose: () => void;
  /** Header title */
  title: string;
  /** Secondary subtitle text */
  subtitle?: string;
  /** Description text (alternative/alias to subtitle for form dialogs) */
  description?: string;
  /** Small category / eyebrow label above title */
  eyebrow?: string;
  /** Leading icon for header */
  icon?: ReactNode;
  /** Dialog content */
  children: ReactNode;

  /**
   * Breakpoint in pixels below which the component renders BottomSheet.
   * Default: 768 (Tailwind 'md')
   */
  breakpoint?: number;

  /**
   * Force rendering mode regardless of viewport width.
   * Default: "auto"
   */
  forceMode?: "auto" | "modal" | "bottomSheet";

  // BottomSheet specific behaviors (active in mobile / bottomSheet mode)
  /** Snap point sizing when rendered as BottomSheet: "auto" | "compact" | "half" | "full" */
  snapPoint?: BottomSheetSnapPoint;
  /** Whether to show top pull handle bar in BottomSheet (default: true) */
  showHandle?: boolean;
  /** Enable drag-down gesture to dismiss sheet (default: true) */
  dismissOnSwipe?: boolean;

  // Shared options
  /** Show top-right X close button (default: true) */
  showCloseButton?: boolean;
  /** Click outside / backdrop dismisses dialog (default: true) */
  dismissOnBackdrop?: boolean;
  /** Extra component or action in header (e.g. badges, actions) */
  headerAction?: ReactNode;
  /** Sticky footer area at bottom (e.g. action buttons) */
  footer?: ReactNode;
  /** Whether the footer stays sticky at the bottom (default: true) */
  footerSticky?: boolean;
  /** Additional classes for footer container */
  footerClassName?: string;
  /** Desktop modal max width: "max-w-md" | "max-w-lg" | "max-w-xl" | "max-w-2xl" | "max-w-3xl" */
  maxWidth?: ModalProps["maxWidth"];
  /** Additional container CSS classes */
  className?: string;
}

/**
 * ResponsiveModal
 *
 * Automatically renders a centered Modal on desktop (>= breakpoint, default 768px)
 * and an ergonomic touch-friendly BottomSheet on mobile (< breakpoint, default 768px)
 * with touch-drag swipe-to-close gestures and snap points.
 */
export function ResponsiveModal({
  open,
  onClose,
  title,
  subtitle,
  description,
  eyebrow,
  icon,
  children,
  breakpoint = 768,
  forceMode = "auto",
  snapPoint = "auto",
  showHandle = true,
  dismissOnSwipe = true,
  showCloseButton = true,
  dismissOnBackdrop = true,
  headerAction,
  footer,
  footerSticky = true,
  footerClassName = "",
  maxWidth = "max-w-xl",
  className = "",
}: ResponsiveModalProps) {
  const isMobile = useIsMobile(breakpoint);

  if (!open) return null;

  const shouldRenderBottomSheet =
    forceMode === "bottomSheet" || (forceMode === "auto" && isMobile);

  const resolvedSubtitle = subtitle || description;

  if (shouldRenderBottomSheet) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title={title}
        subtitle={resolvedSubtitle}
        eyebrow={eyebrow}
        icon={icon}
        snapPoint={snapPoint}
        showHandle={showHandle}
        dismissOnSwipe={dismissOnSwipe}
        showCloseButton={showCloseButton}
        dismissOnBackdrop={dismissOnBackdrop}
        headerAction={headerAction}
        footer={footer}
        footerSticky={footerSticky}
        footerClassName={footerClassName}
        maxWidth={maxWidth}
        className={className}
      >
        {children}
      </BottomSheet>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={resolvedSubtitle}
      description={description}
      eyebrow={eyebrow}
      icon={icon}
      maxWidth={maxWidth}
      headerAction={headerAction}
      footer={footer}
      footerSticky={footerSticky}
      footerClassName={footerClassName}
      showCloseButton={showCloseButton}
      dismissOnBackdrop={dismissOnBackdrop}
      className={className}
    >
      {children}
    </Modal>
  );
}
