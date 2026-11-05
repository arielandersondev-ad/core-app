"use client";

import {
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { Label } from "./Label";
import { Icons } from "./Icons";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface ComboboxProps {
  id?: string;
  label?: string;
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearchChange?: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  error?: string;
  helperText?: string;
  selectSize?: "sm" | "md";
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
}

export function Combobox({
  id,
  label,
  options,
  value,
  defaultValue = "",
  onChange,
  onSearchChange,
  loading = false,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  emptyMessage = "No se encontraron resultados",
  error,
  helperText,
  selectSize = "sm",
  disabled = false,
  clearable = false,
  className = "",
}: ComboboxProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue || (options[0]?.value ?? ""),
  );
  const currentValue = isControlled ? value : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === currentValue);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchLabel = opt.label.toLowerCase().includes(q);
    const matchDesc = opt.description?.toLowerCase().includes(q);
    const matchBadge = opt.badge?.toLowerCase().includes(q);
    return Boolean(matchLabel || matchDesc || matchBadge);
  });

  const selectOption = (optValue: string) => {
    if (!isControlled) {
      setInternalValue(optValue);
    }
    onChange?.(optValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isControlled) {
      setInternalValue("");
    }
    onChange?.("");
    setSearchQuery("");
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus the search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll("li[data-combobox-item]");
      const target = items[highlightedIndex] as HTMLElement | undefined;
      if (target) {
        target.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          const opt = filteredOptions[highlightedIndex];
          if (!opt.disabled) {
            selectOption(opt.value);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery("");
        break;
      case "Tab":
        setIsOpen(false);
        setSearchQuery("");
        break;
    }
  };

  const heightClass =
    selectSize === "sm"
      ? "h-9 text-xs px-3 pr-10 rounded-md"
      : "h-11 text-sm px-3.5 pr-12 rounded-md";
  const itemPaddingClass =
    selectSize === "sm"
      ? "px-2.5 py-1 text-xs rounded-md"
      : "px-3 py-1.5 text-sm rounded-md";

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col gap-1 w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {label && <Label htmlFor={id}>{label}</Label>}

      {/* Trigger Button */}
      <div className="relative w-full">
        <button
          id={id}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={`${heightClass} w-full bg-[var(--surface)] border ${
            error
              ? "border-[var(--danger)] ring-1 ring-[var(--danger)]/30"
              : isOpen
                ? "border-[var(--primary)] ring-2 ring-[var(--ring)]/30"
                : "border-[var(--border)] hover:border-[var(--foreground)]/30"
          } text-left flex items-center justify-between transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {selectedOption ? (
            <div className="flex items-center justify-between gap-3 min-w-0 flex-1 truncate whitespace-nowrap pr-1">
              <div className="flex items-center gap-2 min-w-0 truncate">
                {selectedOption.icon && (
                  <span className="shrink-0 text-[var(--muted)] scale-90">
                    {selectedOption.icon}
                  </span>
                )}
                <span className="truncate text-[var(--foreground)] font-medium min-w-0">
                  {selectedOption.label}
                </span>
              </div>
              {(selectedOption.description || selectedOption.badge) && (
                <div className="flex items-center gap-2 shrink-0 text-right ml-auto">
                  {selectedOption.description && (
                    <span className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                      {selectedOption.description}
                    </span>
                  )}
                  {selectedOption.badge && (
                    <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-mono font-semibold bg-[var(--surface-subtle)] text-[var(--muted)] border border-[var(--border)]">
                      {selectedOption.badge}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
              <span className="text-[var(--muted)] truncate whitespace-nowrap">
                {placeholder}
              </span>
            </div>
          )}

          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[var(--muted)] pointer-events-auto">
            {clearable && currentValue && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="w-4 h-4 rounded hover:bg-[var(--neutral-subtle)] flex items-center justify-center transition-colors text-[var(--muted)] hover:text-[var(--foreground)] cursor-pointer"
                title="Limpiar selección"
                aria-label="Limpiar selección"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            <span
              className={`transition-transform duration-200 pointer-events-none ${
                isOpen ? "rotate-180 text-[var(--primary)]" : ""
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </div>
        </button>

        {/* Dropdown Popover */}
        {isOpen && (
          <div
            className="absolute left-0 right-0 top-full mt-1 z-50 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md shadow-xl overflow-hidden flex flex-col"
            style={{ maxHeight: "15rem" }}
          >
            {/* Search Input Box */}
            <div className="p-1.5 border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-10 flex items-center gap-1.5">
              <span className="text-[var(--muted)] shrink-0 pl-1 scale-90">
                {Icons.search}
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  const q = e.target.value;
                  setSearchQuery(q);
                  onSearchChange?.(q);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none h-6"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-4 h-4 rounded text-[var(--muted)] hover:text-[var(--foreground)] flex items-center justify-center shrink-0 cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* List of Options */}
            <ul
              ref={listRef}
              role="listbox"
              className="p-1 overflow-y-auto flex-1 space-y-0.5"
              style={{ maxHeight: "12rem" }}
            >
              {loading ? (
                <li className="py-4 text-center text-xs text-[var(--muted)] font-mono animate-pulse">
                  Buscando opciones...
                </li>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((opt, index) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={opt.value}
                      data-combobox-item
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => !opt.disabled && selectOption(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`${itemPaddingClass} flex items-center justify-between gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                            ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-semibold"
                            : isHighlighted
                              ? "bg-[var(--surface-subtle)] text-[var(--foreground)]"
                              : "text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {opt.icon && (
                          <span className="shrink-0 text-current opacity-80 scale-85">
                            {opt.icon}
                          </span>
                        )}
                        <span className="text-xs truncate font-medium min-w-0">
                          {opt.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-right ml-auto">
                        {opt.description && (
                          <span className="text-[11px] font-mono text-[var(--muted)] font-normal shrink-0">
                            {opt.description}
                          </span>
                        )}
                        {opt.badge && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)]">
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && (
                          <span className="text-[var(--primary)] scale-80">
                            {Icons.check}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--muted)] scale-90">
                    {Icons.search}
                  </div>
                  <p>{emptyMessage}</p>
                  {searchQuery && (
                    <p className="font-mono text-[10px] text-[var(--muted)]/80">
                      &quot;{searchQuery}&quot;
                    </p>
                  )}
                </div>
              )}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-[var(--danger)] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-[var(--muted)]">{helperText}</p>
      ) : null}
    </div>
  );
}
