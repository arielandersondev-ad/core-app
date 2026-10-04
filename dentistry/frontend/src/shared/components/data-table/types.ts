import React from 'react';

export type TableDensity =
  | 'compact'
  | 'normal'
  | 'comfortable';

export type ActionsMode =
  | 'buttons'
  | 'dropdown';

export interface StatusOption {
  value: string;

  label: string;

  color?:
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral';
}

export interface ColumnConfig<T = Record<string, unknown>> {
  key: keyof T;

  label: string;

  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'image'
    | 'status'
    | 'avatar';

  sortable?: boolean;

  searchable?: boolean;

  width?: string;

  hideOnMobile?: boolean;

  hideOnTablet?: boolean;

  render?: (
    value: unknown,
    row: T
  ) => React.ReactNode;

  statusOptions?: StatusOption[];

  defaultVisible?: boolean;
}

export interface ActionButton<T = Record<string, unknown>> {
  label: string;

  icon?: React.ReactNode;

  onClick: (row: T) => void;

  variant?:
    | 'primary'
    | 'danger'
    | 'warning'
    | 'success'
    | 'neutral';

  show?: (row: T) => boolean;
}

export interface QuickFilter {
  label: string;

  value: string;
}

export interface DynamicTableProps<T = Record<string, unknown>> {
  data: T[];

  columns: ColumnConfig<T>[];

  actions?: ActionButton<T>[];

  pageSize?: number;

  density?: TableDensity;

  actionsMode?: ActionsMode;

  stickyHeader?: boolean;

  showToolbar?: boolean;

  showPagination?: boolean;

  showResultCount?: boolean;

  quickFilters?: QuickFilter[];

  quickFilterKey?: keyof T;

  emptyMessage?: string;

  className?: string;

  onRowClick?: (row: T) => void;

  getRowId?: (row: T, index: number) => string;
}