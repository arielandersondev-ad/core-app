import { api } from '@/infrastructure/http/api';
import { ORGANIZATION_ENDPOINTS } from '../api/endpoints';
import type { OrganizationListItem } from '../types/organization-list';

export const organizationService = {
  async list(): Promise<OrganizationListItem[]> {
    const { data } = await api.get<OrganizationListItem[]>(ORGANIZATION_ENDPOINTS.list);
    return data;
  },
};
