import { api } from '@/infrastructure/http/api';
import { USER_ENDPOINTS } from '@/features/user/api/endpoints';
import type { UserListItem, PaginatedUsersResponse, ListUsersParams } from '@/features/user/types/user-list';
import type { CreateUserItem } from '../types/user';

export const userService = {
  async list(): Promise<UserListItem[]> {
    const res = await api.get<UserListItem[] | { items?: UserListItem[] }>(USER_ENDPOINTS.list);
    const data = res.data;
    if (Array.isArray(data)) {
      return data;
    }
    if (data && Array.isArray(data.items)) {
      return data.items;
    }
    return [];
  },

  async listPaginated(params: ListUsersParams = {}): Promise<PaginatedUsersResponse> {
    const { page = 1, limit = 15, search, status, organizationId } = params;
    const res = await api.get<UserListItem[] | Partial<PaginatedUsersResponse>>(USER_ENDPOINTS.list, {
      params: {
        page,
        limit,
        search: search?.trim() || undefined,
        status: status && status !== 'all' ? status : undefined,
        organizationId: organizationId && organizationId !== 'all' ? organizationId : undefined,
      },
    });
    const resData = res.data;

    // 1. If backend returns canonical paginated payload:
    if (resData && !Array.isArray(resData) && Array.isArray(resData.items) && typeof resData.total === 'number') {
      return {
        items: resData.items,
        total: resData.total,
        page: resData.page ?? page,
        limit: resData.limit ?? limit,
        hasMore: typeof resData.hasMore === 'boolean'
          ? resData.hasMore
          : (resData.page ?? page) * (resData.limit ?? limit) < resData.total,
      };
    }

    // 2. Resilient fallback if backend returns raw array:
    const allItems: UserListItem[] = Array.isArray(resData) ? resData : [];
    const query = search?.trim().toLocaleLowerCase() || '';
    const filtered = allItems.filter((user) => {
      const matchSearch =
        !query ||
        `${user.firstName} ${user.lastName} ${user.email}`.toLocaleLowerCase().includes(query);
      const matchStatus = !status || status === 'all' || user.status.toUpperCase() === status.toUpperCase();
      const matchOrg =
        !organizationId ||
        organizationId === 'all' ||
        user.memberships.some((m) => m.organizationId === organizationId);
      return matchSearch && matchStatus && matchOrg;
    });

    const start = (page - 1) * limit;
    const end = start + limit;
    const pageItems = filtered.slice(start, end);

    return {
      items: pageItems,
      total: filtered.length,
      page,
      limit,
      hasMore: end < filtered.length,
    };
  },

  async create(data: CreateUserItem): Promise<void> {
    await api.post(USER_ENDPOINTS.create, data);
  },
};
