"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from "react";
import { Label } from "./Label";
import { Icons } from "./Icons";

export interface DatePickerProps {
  id?: string;
  label?: string;
  value?: string; // Format "YYYY-MM-DD"
  onChange?: (dateStr: string) => void;
  error?: string;
  hint?: string;
  pickerSize?: "sm" | "md";
  minDate?: string;
  maxDate?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

function parseISODate(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const date = new Date(y, m, d);
  if (date.getFullYear() !== y || date.getMonth() !== m || date.getDate() !== d)
    return null;
  return date;
}

function formatToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DatePicker({
  id,
  label,
  value = "",
  onChange,
  error,
  hint,
  pickerSize = "sm",
  minDate,
  maxDate,
  placeholder = "YYYY-MM-DD",
  disabled = false,
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState(value);

  const initialDate = parseISODate(value) || new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text with value prop
  useEffect(() => {
    setTextInput(value);
    const parsed = parseISODate(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle direct text typing
  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextInput(val);
    const parsed = parseISODate(val);
    if (parsed && onChange) {
      onChange(val);
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  };

  const handleBlur = () => {
    // If text is not valid, reset to current valid value
    if (textInput && !parseISODate(textInput)) {
      setTextInput(value);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    const iso = formatToISO(selected);
    setTextInput(iso);
    if (onChange) onChange(iso);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const iso = formatToISO(today);
    setTextInput(iso);
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    if (onChange) onChange(iso);
    setIsOpen(false);
  };

  // Compute days for calendar grid
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // In JS: 0=Sun, 1=Mon, ..., 6=Sat. Convert to Monday=0
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const todayStr = formatToISO(new Date());

  const heightClass = pickerSize === "sm" ? "h-9 text-xs" : "h-11 text-sm";

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1 w-full ${className}`}
    >
      {label && <Label htmlFor={id}>{label}</Label>}

      <div className="relative flex items-center w-full">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={textInput}
          onChange={handleTextChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`${heightClass} w-full pl-3 pr-9 rounded-md bg-[var(--surface)] border ${
            error
              ? "border-[var(--danger)] ring-1 ring-[var(--danger)]/30"
              : isOpen
                ? "border-[var(--primary)] ring-2 ring-[var(--ring)]/30"
                : "border-[var(--border)] hover:border-[var(--foreground)]/30"
          } text-[var(--foreground)] placeholder:text-[var(--muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/30 focus:border-[var(--primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        />

        {/* Calendar Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors p-1 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Abrir calendario"
          aria-label="Abrir calendario"
        >
          <span className="scale-90 flex items-center">{Icons.calendar}</span>
        </button>
      </div>

      {hint && !error && (
        <p className="text-[11px] text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      {/* Popover Calendar */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Selector de fecha"
          className="absolute z-50 top-full mt-1.5 left-0 w-64 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {/* Header con mes, año y navegación */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              aria-label="Mes anterior"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="text-xs font-semibold text-[var(--foreground)]">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)] cursor-pointer"
              aria-label="Mes siguiente"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAY_LABELS.map((d) => (
              <span
                key={d}
                className="text-[10px] font-semibold text-[var(--muted)]"
              >
                {d}
              </span>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-1">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="w-7 h-7" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = dateStr === value;
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-7 h-7 rounded-md text-xs flex items-center justify-center font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs"
                      : isToday
                        ? "border border-[var(--primary)] text-[var(--primary)] font-semibold hover:bg-[var(--surface-subtle)]"
                        : "text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer con atajo Hoy */}
          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] font-semibold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Hoy
            </button>
            <span className="text-[10px] text-[var(--muted)] font-mono">
              {todayStr}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
