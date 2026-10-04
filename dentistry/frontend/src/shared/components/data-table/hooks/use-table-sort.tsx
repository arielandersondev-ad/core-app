'use client';
import { useMemo } from 'react';

import type { ColumnConfig } from '../types';
import { getNestedValue } from '../utils/get-nested-value';

export interface SortConfig {
  key: string;

  direction: 'asc' | 'desc';
}

export function useTableSort<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  sortConfig: SortConfig | null
) {
  return useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(
        a,
        sortConfig.key
      );

      const bValue = getNestedValue(
        b,
        sortConfig.key
      );

      const column = columns.find(
        (c) => String(c.key) === sortConfig.key
      );

      const type = column?.type ?? 'text';

      let comparison = 0;

      switch (type) {
        case 'number':
          comparison =
            Number(aValue) - Number(bValue);
          break;

        case 'date':
          comparison =
            new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime();
          break;

        default:
          comparison = String(aValue ?? '')
            .toLowerCase()
            .localeCompare(
              String(bValue ?? '').toLowerCase()
            );
      }

      return sortConfig.direction === 'asc'
        ? comparison
        : -comparison;
    });
  }, [data, columns, sortConfig]);
}