'use client';

import { useEffect, useId, useRef, useState,} from 'react';

export type MultiSelectOption = Readonly<{
  id: string;
  label: string;
  description?: string;
}>;

type MultiSelectFieldProps = {
  label: string;
  options: MultiSelectOption[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
};

export function MultiSelectField({
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
  emptyMessage,
  disabled = false,
  isLoading = false,
  error,
  onRetry,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const listId = `${fieldId}-options`;

  const selectedOptions = options.filter((option) =>
    selectedIds.includes(option.id),
  );

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        !containerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function toggleOption(optionId: string) {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
      return;
    }

    onChange([...selectedIds, optionId]);
  }

  const unavailable = disabled || isLoading

  return (
    <div ref={containerRef} className="relative">
      <label
        id={`${fieldId}-label`}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        {label}
      </label>

      <button
        type="button"
        aria-labelledby={`${fieldId}-label`}
        aria-controls={listId}
        aria-expanded={open}
        disabled={unavailable}
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex min-h-11 w-full items-center justify-between gap-3',
          'rounded-md border border-border bg-surface px-3 py-2 text-left',
          'text-sm outline-none transition',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-60',
        ].join(' ')}
      >
        <span className="min-w-0 flex-1">
          {isLoading ? (
            <span className="text-muted">Cargando opciones…</span>
          ) : selectedOptions.length === 0 ? (
            <span className="text-muted">{placeholder}</span>
          ) : (
            <span className="flex flex-wrap gap-1.5">
              {selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="rounded-md bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {option.label}
                </span>
              ))}
            </span>
          )}
        </span>

        <span
          aria-hidden="true"
          className={`shrink-0 text-muted transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▾
        </span>
      </button>

      {open && !unavailable && (
        <fieldset
          id={listId}
          className={[
            'absolute z-40 mt-1 max-h-64 w-full overflow-y-auto',
            'rounded-md border border-border bg-surface-elevated p-2 shadow-xl',
          ].join(' ')}
        >
          <legend className="sr-only">{label}</legend>

          {options.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-1">
              {options.map((option) => {
                const selected = selectedIds.includes(option.id);

                return (
                  <label
                    key={option.id}
                    className={[
                      'flex cursor-pointer items-start gap-3 rounded-md',
                      'border px-3 py-2.5 transition-colors',
                      selected
                        ? 'border-primary bg-primary-subtle'
                        : 'border-transparent hover:bg-background',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleOption(option.id)}
                      className="mt-0.5 size-4 accent-primary"
                    />

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {option.label}
                      </span>

                      {option.description && (
                        <span className="mt-0.5 block truncate text-xs text-muted">
                          {option.description}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      {error && (
        <div
          role="alert"
          className="mt-1.5 flex items-center justify-between gap-3"
        >
          <p className="text-xs text-danger">{error}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs font-medium text-danger underline"
            >
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
}