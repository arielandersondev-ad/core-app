"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Label } from "./Label";
import { Icons } from "./Icons";

export interface TimePickerProps {
  id?: string;
  label?: string;
  value?: string; // Format "HH:MM", e.g. "09:00"
  onChange?: (timeStr: string) => void;
  error?: string;
  hint?: string;
  pickerSize?: "sm" | "md";
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const COMMON_SLOTS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
];

function isValidTime(str?: string): boolean {
  if (!str) return false;
  const match = str.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  return Boolean(match);
}

function normalizeTime(str?: string): string {
  if (!str) return "";
  const parts = str.split(":");
  if (parts.length !== 2) return str;
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

export function TimePicker({
  id,
  label,
  value = "",
  onChange,
  error,
  hint,
  pickerSize = "sm",
  placeholder = "HH:MM (ej. 09:30)",
  disabled = false,
  className = "",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState(value);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text with value prop
  useEffect(() => {
    setTextInput(value);
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
    if (isValidTime(val) && onChange) {
      onChange(normalizeTime(val));
    }
  };

  const handleBlur = () => {
    if (textInput && isValidTime(textInput)) {
      const normalized = normalizeTime(textInput);
      setTextInput(normalized);
      if (onChange) onChange(normalized);
    } else if (textInput) {
      setTextInput(value);
    }
  };

  const handleSelectSlot = (slot: string) => {
    setTextInput(slot);
    if (onChange) onChange(slot);
    setIsOpen(false);
  };

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

        {/* Clock Trigger Button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--primary)] transition-colors p-1 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Abrir selector de hora"
          aria-label="Abrir selector de hora"
        >
          <span className="scale-90 flex items-center">{Icons.clock}</span>
        </button>
      </div>

      {hint && !error && (
        <p className="text-[11px] text-[var(--muted)]">{hint}</p>
      )}
      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      {/* Popover Horarios */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Selector de hora"
          className="absolute z-50 top-full mt-1.5 left-0 w-60 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md shadow-xl p-3 animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)] font-semibold mb-2">
            Horarios frecuentes
          </div>

          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
            {COMMON_SLOTS.map((slot) => {
              const isSelected = slot === normalizeTime(value);

              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-1 rounded-md text-xs font-mono transition-colors cursor-pointer text-center ${
                    isSelected
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] font-bold shadow-xs"
                      : "bg-[var(--surface-subtle)] text-[var(--foreground)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)]"
                  }`}
                >
                  {slot}
                </button>
              );
            })}
          </div>

          {/* Selector rápido por hora */}
          <div className="mt-2.5 pt-2 border-t border-[var(--border)] flex justify-between items-center text-xs">
            <span className="text-[10px] text-[var(--muted)]">
              Texto o botón:
            </span>
            <span className="text-[10px] font-mono font-semibold text-[var(--primary)]">
              {value || "Sin hora"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
