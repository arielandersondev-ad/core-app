"use client";

import { type ReactNode } from "react";
import { BottomSheet } from "./BottomSheet";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Icons } from "./Icons";

export interface FilterTriggerButtonProps {
  onClick?: () => void;
  activeCount?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * FilterTriggerButton
 *
 * Compact button showing a filter icon, customizable label ("Filtros" by default),
 * and a badge displaying the active filter count when activeCount > 0.
 */
export function FilterTriggerButton({
  onClick,
  activeCount = 0,
  label = "Filtros",
  className = "",
  disabled = false,
}: FilterTriggerButtonProps) {
  const hasActiveFilters = typeof activeCount === "number" && activeCount > 0;

  return (
    <Button
      type="button"
      variant={hasActiveFilters ? "primary" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      leftIcon={Icons.filter}
      className={`relative inline-flex items-center gap-1.5 font-medium transition-colors ${className}`}
    >
      <span>{label}</span>
      {hasActiveFilters && (
        <Badge
          variant={hasActiveFilters ? "primary" : "neutral"}
          size="sm"
          className="ml-1 px-1.5 py-0 text-[11px] font-bold min-h-[18px] bg-primary-foreground/20 text-inherit rounded-full"
        >
          {activeCount}
        </Badge>
      )}
    </Button>
  );
}

export interface MobileFilterSheetProps {
  /** Controls visibility of the sheet */
  isOpen: boolean;
  /** Callback fired when user requests close (ESC, backdrop, close button, swipe) */
  onClose: () => void;
  /** Header title (default: "Filtros") */
  title?: string;
  /** Number of currently active filters (shown in header badge when > 0) */
  activeCount?: number;
  /** Callback fired when "Aplicar filtros" is clicked */
  onApply?: () => void;
  /** Callback fired when "Limpiar" is clicked */
  onClear?: () => void;
  /** Label for apply button (default: "Aplicar filtros") */
  applyLabel?: string;
  /** Label for clear button (default: "Limpiar") */
  clearLabel?: string;
  /** Filter inputs / options content */
  children: ReactNode;
  /** Optional trigger element rendered before/outside the sheet */
  trigger?: ReactNode;
  /** Container CSS classes */
  className?: string;
}

/**
 * MobileFilterSheet
 *
 * Standardized bottom sheet drawer designed for mobile screens (< 768px)
 * to house secondary filters, category selectors, and search facets.
 * Includes a sticky bottom action bar with "Limpiar" and "Aplicar filtros".
 */
export function MobileFilterSheet({
  isOpen,
  onClose,
  title = "Filtros",
  activeCount = 0,
  onApply,
  onClear,
  applyLabel = "Aplicar filtros",
  clearLabel = "Limpiar",
  children,
  trigger,
  className = "",
}: MobileFilterSheetProps) {
  const hasActiveFilters = typeof activeCount === "number" && activeCount > 0;

  const headerBadge = hasActiveFilters ? (
    <Badge variant="primary" size="sm" className="font-semibold">
      {`${activeCount} ${activeCount === 1 ? "activo" : "activos"}`}
    </Badge>
  ) : undefined;

  const footerActions = (
    <div className="flex w-full items-center justify-between gap-3">
      <Button
        type="button"
        variant="outline"
        size="md"
        onClick={onClear}
        className="flex-1"
      >
        {clearLabel}
      </Button>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={() => {
          onApply?.();
          onClose();
        }}
        className="flex-1"
      >
        {applyLabel}
      </Button>
    </div>
  );

  return (
    <>
      {trigger}
      <BottomSheet
        open={isOpen}
        onClose={onClose}
        title={title}
        headerAction={headerBadge}
        footer={footerActions}
        footerSticky={true}
        footerClassName="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4"
        snapPoint="half"
        showHandle={true}
        showCloseButton={true}
        dismissOnBackdrop={true}
        dismissOnSwipe={true}
        className={className}
      >
        <div className="space-y-4 py-1">{children}</div>
      </BottomSheet>
    </>
  );
}

// Re-export alias as requested in contract
export { MobileFilterSheet as FilterBottomSheet };
