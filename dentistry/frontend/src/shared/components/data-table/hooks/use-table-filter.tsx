'use client';
import { useMemo } from 'react';

import type { ColumnConfig } from '../types';
import { getNestedValue } from '../utils/get-nested-value';

export function useTableFilter<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  searchTerm: string,
  quickFilterKey?: keyof T,
  quickFilterValue?: string
) {
  return useMemo(() => {
    const bySearch = searchTerm
      ? data.filter((row: T) =>
          columns.some((column) => {
            if (column.searchable === false)
              return false;

            const value = getNestedValue(
              row,
              String(column.key)
            );

            return String(value ?? '')
              .toLowerCase()
              .includes(searchTerm.toLowerCase());
          })
        )
      : data;

    if (!quickFilterKey || !quickFilterValue)
      return bySearch;

    return bySearch.filter(
      (row) =>
        String(getNestedValue(row, String(quickFilterKey)) ?? '') ===
        quickFilterValue
    );
  }, [
    data,
    columns,
    searchTerm,
    quickFilterKey,
    quickFilterValue,
  ]);
}