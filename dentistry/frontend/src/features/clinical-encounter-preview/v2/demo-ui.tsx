"use client";

import type { ReactNode } from "react";
import { Badge, DatePicker, Label, TimePicker, type BadgeVariant } from "@/shared/components/ui";
import type { ClinicalEncounter, EncounterProcedure } from "../types";
import { statusLabels, targetTypeLabels, type DemoToast, type ToastTone } from "./demo-store";
import styles from "./demo.module.css";

/* ── Iconos propios del prototipo (no forman parte del catálogo) ─────────── */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const DemoTags = {
  xray: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 12h18M12 3v18" />
    </svg>
  ),
  file: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
  edit: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4z" />
    </svg>
  ),
  spark: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18" />
    </svg>
  ),
  pulse: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  check: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ban: (
    <svg width="15" height="15" viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <line x1="5.5" y1="5.5" x2="18.5" y2="18.5" />
    </svg>
  ),
};

/* ── Estados y objetivos ─────────────────────────────────────────────────── */

const statusVariant: Record<ClinicalEncounter["status"], BadgeVariant> = {
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  VOIDED: "neutral",
};

export function StatusBadge({ status, size = "sm" }: { status: ClinicalEncounter["status"]; size?: "sm" | "md" }) {
  return (
    <Badge variant={statusVariant[status]} dot size={size}>
      {statusLabels[status]}
    </Badge>
  );
}

const targetVariant: Record<EncounterProcedure["targetType"], BadgeVariant> = {
  TOOTH: "primary",
  REGION: "neutral",
  WHOLE_MOUTH: "neutral",
  OTHER: "neutral",
};

export function TargetBadge({ targetType, toothNumber }: { targetType: EncounterProcedure["targetType"]; toothNumber?: string }) {
  const suffix = targetType === "TOOTH" && toothNumber ? ` · ${toothNumber}` : "";
  return (
    <Badge variant={targetVariant[targetType]}>
      {targetTypeLabels[targetType]}
      {suffix}
    </Badge>
  );
}

/* ── Bloques de presentación ─────────────────────────────────────────────── */

export function Panel({
  id,
  title,
  description,
  icon,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section aria-labelledby={id} className={`rounded-xl border border-border bg-surface shadow-2xs overflow-hidden ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-subtle text-primary">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 id={id} className="font-display text-sm font-semibold text-foreground sm:text-base">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={`px-4 py-4 sm:px-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function InfoRow({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</dt>
      <dd className={`text-sm font-medium text-foreground ${mono ? "font-mono" : ""}`}>{value || "—"}</dd>
    </div>
  );
}

export function TextBlock({ label, value }: { label: string; value?: string }) {
  const hasValue = Boolean(value && value.trim());
  return (
    <div className="space-y-1">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className={`whitespace-pre-line text-sm leading-relaxed ${hasValue ? "text-foreground" : "italic text-muted"}`}>
        {hasValue ? value : "Sin registrar"}
      </p>
    </div>
  );
}

/* ── Fecha y hora adaptativas ────────────────────────────────────────────── */
/*
 * En mobile se usan los pickers nativos (`type="date"` / `type="time"`) para
 * aprovechar el selector del sistema; en desktop se conserva el DatePicker /
 * TimePicker del Design System. El dual-render es por CSS para no depender de
 * la medición del viewport ni provocar diferencias de hidratación.
 */

const nativeInputClass =
  "h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30";

export function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="hidden md:block">
        <DatePicker id={id} label={label} value={value} onChange={onChange} pickerSize="md" />
      </div>
      <div className="space-y-1 md:hidden">
        <Label htmlFor={`${id}-native`}>{label}</Label>
        <input
          id={`${id}-native`}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={nativeInputClass}
        />
      </div>
    </div>
  );
}

export function TimeField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <div className="hidden md:block">
        <TimePicker id={id} label={label} value={value} onChange={onChange} pickerSize="md" />
      </div>
      <div className="space-y-1 md:hidden">
        <Label htmlFor={`${id}-native`}>{label}</Label>
        <input
          id={`${id}-native`}
          type="time"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={nativeInputClass}
        />
      </div>
    </div>
  );
}

/* ── Avisos efímeros ─────────────────────────────────────────────────────── */

const toastVariant: Record<ToastTone, string> = {
  success: "border-success/30 bg-success-subtle text-success",
  info: "border-primary/30 bg-primary-subtle text-primary",
  warning: "border-warning/30 bg-warning-subtle text-warning",
  danger: "border-danger/30 bg-danger-subtle text-danger",
};

export function ToastStack({ toasts, onDismiss }: { toasts: DemoToast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:inset-x-auto sm:right-6 sm:items-end"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm shadow-lg ${toastVariant[toast.tone]} ${styles.toastIn}`}
        >
          <span className="shrink-0">{DemoTags.check}</span>
          <span className="flex-1 font-medium">{toast.message}</span>
          <span className="shrink-0 text-[10px] font-mono uppercase opacity-70">demo</span>
        </button>
      ))}
    </div>
  );
}
