export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page: number;
  pageSize: number;
};

export type PaginationMetadata = PaginationInput & {
  totalItems: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMetadata;
};

export function createPaginatedResult<T>(
  items: T[],
  input: PaginationInput,
  totalItems: number,
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      ...input,
      totalItems,
      totalPages: Math.ceil(totalItems / input.pageSize),
    },
  };
}
