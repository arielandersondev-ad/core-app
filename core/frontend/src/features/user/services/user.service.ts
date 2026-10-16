import { api } from '@/infrastructure/http/api';
import { USER_ENDPOINTS } from '@/features/user/api/endpoints';
import type { UserListItem } from '@/features/user/types/user-list';
import { CreateUserItem } from '../types/user';

export const userService = {
  async list(): Promise<UserListItem[]> {
    const { data } = await api.get<UserListItem[]>(USER_ENDPOINTS.list);
    return data;
  },

  async create(data: CreateUserItem): Promise<void> {
    await api.post(USER_ENDPOINTS.create,data)
  }
};
