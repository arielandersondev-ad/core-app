"use client";

import type { ReactNode } from "react";
import { Icons } from "@/shared/components/ui";
import type {
  ClinicalEncounterToast,
  ToastTone,
} from "@/features/clinical-encounter/hooks/use-toasts";

const toastVariant: Record<ToastTone, string> = {
  success: "border-success/30 bg-success-subtle text-success",
  info: "border-primary/30 bg-primary-subtle text-primary",
  warning: "border-warning/30 bg-warning-subtle text-warning",
  danger: "border-danger/30 bg-danger-subtle text-danger",
};

const toastIcon: Record<ToastTone, ReactNode> = {
  success: Icons.check,
  info: Icons.clock,
  warning: Icons.alertTriangle,
  danger: Icons.alertTriangle,
};

export interface ClinicalEncounterToastStackProps {
  toasts: ClinicalEncounterToast[];
  onDismiss: (id: string) => void;
}

export function ClinicalEncounterToastStack({ toasts, onDismiss }: ClinicalEncounterToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:inset-x-auto sm:right-6 sm:items-end"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm shadow-lg ${toastVariant[toast.tone]}`}
        >
          <span className="shrink-0">{toastIcon[toast.tone]}</span>
          <span className="flex-1 font-medium">{toast.message}</span>
          <span className="shrink-0 font-mono text-[10px] uppercase opacity-70">UI</span>
        </button>
      ))}
    </div>
  );
}

export const ToastStack = ClinicalEncounterToastStack;
