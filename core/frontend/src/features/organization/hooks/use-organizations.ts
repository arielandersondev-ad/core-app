'use client';

import { useQuery } from '@tanstack/react-query';
import { organizationQueryKeys } from '../api/endpoints';
import { organizationService } from '../services/organization.service';

export function useOrganizations() {
  return useQuery({
    queryKey: organizationQueryKeys.list(),
    queryFn: organizationService.list,
  });
}
