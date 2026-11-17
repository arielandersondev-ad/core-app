export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 15;
export const MAX_PAGE_SIZE = 100;

export type PaginationInput = {
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;
};

export type PaginationMetadata = {
  page: number;
  pageSize: number;
  limit: number;
  totalItems: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  pagination: PaginationMetadata;
};

export function createPaginatedResult<T>(
  items: T[],
  input: PaginationInput,
  totalItems: number,
): PaginatedResult<T> {
  const limit = Math.max(1, input.limit ?? input.pageSize ?? DEFAULT_PAGE_SIZE);
  let page = Math.max(1, input.page ?? DEFAULT_PAGE);
  if (input.offset !== undefined && input.offset >= 0) {
    page = Math.floor(input.offset / limit) + 1;
  }
  const totalPages = Math.ceil(totalItems / limit);
  const skip = input.offset !== undefined && input.offset >= 0 ? input.offset : (page - 1) * limit;
  const hasMore = skip + items.length < totalItems;

  const metadata: PaginationMetadata = {
    page,
    pageSize: limit,
    limit,
    totalItems,
    total: totalItems,
    totalPages,
    hasMore,
  };

  return {
    items,
    total: totalItems,
    page,
    limit,
    hasMore,
    pagination: metadata,
  };
}
