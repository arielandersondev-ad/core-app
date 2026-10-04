interface Props {
  searchTerm: string;

  onSearch: (value: string) => void;

  columns?: {
    key: string;
    label: string;
  }[];

  visibleColumns?: string[];

  onToggleColumn?: (
    key: string
  ) => void;

  quickFilters?: {
    label: string;
    value: string;
  }[];

  activeQuickFilter?: string;

  onQuickFilter?: (value: string) => void;

  searchPlaceholder?: string;
}

export function DataTableToolbar({
  searchTerm,
  onSearch,
  quickFilters = [],
  activeQuickFilter,
  onQuickFilter,
  searchPlaceholder = 'Buscar...',
  // TODO: re-enable column visibility toggle when the
  // dropdown-menu component lands
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  columns,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  visibleColumns,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleColumn,
}: Props) {
  return (
    <div
      className="
        border-b
        border-border
        bg-background
        p-4
      "
    >
      <div
        className="
          flex
          flex-col
          gap-3
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {quickFilters.map((filter) => {
            const isActive =
              activeQuickFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() =>
                  onQuickFilter?.(filter.value)
                }
                className={`
                  rounded-[2px]
                  px-2.5
                  py-1
                  font-mono
                  text-[10px]
                  uppercase
                  tracking-widest
                  transition-colors
                  ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }
                `}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-xs flex items-center gap-2">
          <input
            value={searchTerm}
            onChange={(e) =>
              onSearch(e.target.value)
            }
            placeholder={searchPlaceholder}
            className="
              w-full
              rounded-[4px]
              border
              border-border
              px-4
              py-2
            "
          />
        </div>
      </div>
    </div>
  );
}