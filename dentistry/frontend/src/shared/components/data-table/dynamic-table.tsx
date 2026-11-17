'use client';
import { useState } from 'react';

import type { DynamicTableProps, ColumnConfig } from './types';

import { DataTableAvatar } from './components/data-table-avatar';
import { DataTableStatus } from './components/data-table-status';
import { DataTableEmpty } from './components/data-table-empty';
import { DataTablePagination } from './components/data-table-pagination';
import { DataTableToolbar } from './components/data-table-toolbar';
import { DataTableActions } from './components/data-table-actions';

import { useTableFilter } from './hooks/use-table-filter';
import { useTableSort } from './hooks/use-table-sort';
import { useTablePagination } from './hooks/use-table-pagination';

import { getNestedValue } from './utils/get-nested-value';
import { formatDate } from './utils/format-date';
import { getDensityClass } from './utils/get-density-class';

export function DynamicTable<
  T extends Record<string, any>
>({
  data,
  columns,
  actions = [],

  pageSize = 10,

  density = 'normal',

  actionsMode = 'dropdown',

  stickyHeader = true,

  showToolbar = true,

  showPagination = true,

  showResultCount = true,

  emptyMessage = 'No se encontraron registros',

  onRowClick,

  className = '',
}: DynamicTableProps<T>) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    columns.filter((c) => c.defaultVisible !== false).map((c) => c.key as string)
  );

  const displayedColumns = columns.filter(
    column => visibleColumns.includes(String(column.key))
  );
  
  const [searchTerm, setSearchTerm] =
    useState('');

  const [currentPage, setCurrentPage] =
    useState(1);

  const [sortConfig, setSortConfig] =
    useState<{
      key: string;
      direction: 'asc' | 'desc';
    } | null>(null);

  const filteredData =
    useTableFilter(
      data,
      columns,
      searchTerm
    );

  const sortedData = useTableSort(
    filteredData,
    columns,
    sortConfig
  );

  const paginatedData =
    showPagination
      ? useTablePagination(
          sortedData,
          currentPage,
          pageSize
        )
      : sortedData;

  const totalPages = Math.ceil(
    sortedData.length / pageSize
  );

  const densityClass =
    getDensityClass(density);

  const handleSort = (
    key: string
  ) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction:
            current.direction === 'asc'
              ? 'desc'
              : 'asc',
        };
      }

      return {
        key,
        direction: 'asc',
      };
    });
  };

  const renderCell = (
    column: ColumnConfig<T>,
    row: T
  ) => {
    const value = getNestedValue(
      row,
      column.key as string
    );

    if (column.render) {
      return column.render(
        value,
        row
      );
    }

    switch (column.type) {
      case 'avatar':
        return (
          <DataTableAvatar
            value={String(value ?? '')}
          />
        );

      case 'date':
        return formatDate(value);

      case 'status': {
        const status =
          column.statusOptions?.find(
            (s) =>
              s.value ===
              String(value)
          );

        return (
          <DataTableStatus
            label={
              status?.label ??
              String(value)
            }
            color={
              status?.color ??
              'neutral'
            }
          />
        );
      }

      case 'number':
        return typeof value ===
          'number'
          ? value.toLocaleString(
              'es-ES'
            )
          : value;

      case 'image':
        return value ? (
          <img
            src={value}
            alt=""
            className="
              h-10
              w-10
              rounded-md
              object-cover
            "
          />
        ) : (
          '-'
        );

      default:
        return value ?? '-';
    }
  };

  return (
    <div
      className={`
        overflow-hidden
        rounded-xl
        border
        border-border
        bg-surface
        ${className}
      `}
    >
      {showToolbar && (
        <DataTableToolbar
          searchTerm={searchTerm}
          onSearch={(value) => {
            setSearchTerm(value);
            setCurrentPage(1);
          }}
          columns={columns.map((c) => ({
            key: String(c.key),
            label: c.label,
          }))}
          visibleColumns={visibleColumns}
          onToggleColumn={(key) => {
            setVisibleColumns((prev) =>
              prev.includes(key)
                ? prev.filter((c) => c !== key)
                : [...prev, key]
            );
          }}
        />
      )}

      {/* Vista Móvil: Tarjetas (< 768px / md) */}
      <div className="block md:hidden divide-y divide-border">
        {paginatedData.length === 0 ? (
          <div className="p-4">
            <DataTableEmpty message={emptyMessage} />
          </div>
        ) : (
          paginatedData.map((row, rowIndex) => (
            <article
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={`p-4 transition-colors hover:bg-background/60 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                {displayedColumns.length > 0 && (
                  <div className="font-semibold text-sm text-foreground">
                    {renderCell(displayedColumns[0], row)}
                  </div>
                )}
                {actions.length > 0 && (
                  <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                    <DataTableActions
                      row={row}
                      actions={actions}
                      mode={actionsMode}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {displayedColumns.slice(1).map((column) => (
                  <div key={String(column.key)}>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block mb-0.5">
                      {column.label}
                    </span>
                    <div className="text-foreground">
                      {renderCell(column, row)}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Vista Desktop: Tabla tradicional (>= 768px / md) */}
      <div className="hidden md:block overflow-auto">
        <table className="w-full">
          <thead
            className={`
              bg-background/40
              ${
                stickyHeader
                  ? 'sticky top-0 z-10'
                  : ''
              }
            `}
          >
            <tr>
              {displayedColumns.map(
                (column) => (
                  <th
                    key={String(
                      column.key
                    )}
                    onClick={() =>
                      column.sortable !==
                        false &&
                      handleSort(
                        String(
                          column.key
                        )
                      )
                    }
                    className={`
                      px-4
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-muted-foreground
                      ${
                        column.sortable !==
                        false
                          ? 'cursor-pointer'
                          : ''
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}

                      {sortConfig?.key ===
                        column.key && (
                        <span>
                          {sortConfig.direction ===
                          'asc'
                            ? '↑'
                            : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              )}

              {actions.length >
                0 && (
                <th className="w-16 px-4 py-3" />
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedData.length ===
            0 ? (
              <tr>
                <td
                  colSpan={
                    displayedColumns.length +
                    (actions.length >
                    0
                      ? 1
                      : 0)
                  }
                >
                  <DataTableEmpty
                    message={
                      emptyMessage
                    }
                  />
                </td>
              </tr>
            ) : (
              paginatedData.map(
                (
                  row,
                  rowIndex
                ) => (
                  <tr
                    key={rowIndex}
                    onClick={() =>
                      onRowClick?.(
                        row
                      )
                    }
                    className={`
                      border-t
                      border-border
                      transition-colors
                      hover:bg-background
                      ${
                        onRowClick
                          ? 'cursor-pointer'
                          : ''
                      }
                    `}
                  >
                    {displayedColumns.map(
                      (
                        column
                      ) => (
                        <td
                          key={String(
                            column.key
                          )}
                          className={`
                            px-4
                            ${densityClass}
                            text-sm
                          `}
                        >
                          {renderCell(
                            column,
                            row
                          )}
                        </td>
                      )
                    )}

                    {actions.length >
                      0 && (
                      <td className="px-4">
                        <DataTableActions
                          row={row}
                          actions={
                            actions
                          }
                          mode={
                            actionsMode
                          }
                        />
                      </td>
                    )}
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {(showPagination ||
        showResultCount) && (
        <div
          className="
            flex
            items-center
            justify-between
            border-t
            px-4
            py-3
          "
        >
          {showResultCount && (
            <span
              className="
                text-sm
                text-muted-foreground
              "
            >
              {
                sortedData.length
              }{' '}
              resultados
            </span>
          )}

          {showPagination &&
            totalPages > 1 && (
              <DataTablePagination
                currentPage={
                  currentPage
                }
                totalPages={
                  totalPages
                }
                onChange={
                  setCurrentPage
                }
              />
            )}
        </div>
      )}
    </div>
  );
}