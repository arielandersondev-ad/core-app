'use client';

import { useEffect, useRef, useState } from 'react';

import type { ActionButton, ActionsMode } from '../types';

interface Props<T> {
  row: T;
  actions: ActionButton<T>[];
  mode?: ActionsMode;
}

export function DataTableActions<T>({
  row,
  actions,
  mode = 'buttons',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
  }, []);

  const visibleActions = actions.filter(
    (action) => (action.show ? action.show(row) : true)
  );

  if (mode === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        {visibleActions.map((action, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick(row);
            }}
            className="rounded-[4px] border border-border px-3 py-1 text-xs hover:bg-background"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="relative"
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="
          h-8
          w-8
          rounded-[4px]
          hover:bg-background
          flex
          items-center
          justify-center
        "
      >
        ⋮
      </button>

      {open && (
        <div
          className="
            absolute
            right-0
            z-50
            mt-2
            min-w-[180px]
            rounded-[4px]
            border
            border-border
            bg-surface-elevated
            shadow-lg
          "
        >
          {visibleActions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row);
                setOpen(false);
              }}
              className="
                flex
                w-full
                items-center
                gap-2
                px-4
                py-2
                text-left
                text-sm
                hover:bg-background
              "
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}