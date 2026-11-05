export type UserListItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  memberships: {
    organizationId: string;
    organizationName: string;
    branchNames: string[];
    roleNames: string[];
  }[];
};

export type PaginatedUsersResponse = {
  items: UserListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

export type ListUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  organizationId?: string;
};
