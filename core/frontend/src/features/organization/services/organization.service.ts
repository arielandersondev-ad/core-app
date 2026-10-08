import { api } from '@/infrastructure/http/api';
import { ORGANIZATION_ENDPOINTS } from '../api/endpoints';
import type { OrganizationListItem } from '../types/organization-list';
import type { OrganizationSetupPayload } from '../types/organization-setup';
import type { branchMinimalList } from '../types/branch';

export const organizationService = {
  async list(): Promise<OrganizationListItem[]> {
    const { data } = await api.get<OrganizationListItem[]>(ORGANIZATION_ENDPOINTS.collection);
    return data;
  },

  async createSetup(data: OrganizationSetupPayload): Promise<void> {
    await api.post(ORGANIZATION_ENDPOINTS.createSetup, data);
  },

  async branchList(organizationId: string): Promise <branchMinimalList[]> {
    const {data} = await api.get<branchMinimalList[]>(ORGANIZATION_ENDPOINTS.branches(organizationId))
    return data
  }
};
