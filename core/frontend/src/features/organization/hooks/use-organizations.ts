'use client';

import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationQueryKeys } from '../api/endpoints';
import { organizationService } from '../services/organization.service';

export function useOrganizations() {
  return useQuery({
    queryKey: organizationQueryKeys.list(),
    queryFn: organizationService.list,
  });
}

export function useCreateOrganizationSetup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.createSetup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.all,
      });
    },
  });
}

export function useBranches(organizationId: string) {
  return useQuery({
    queryKey: organizationQueryKeys.branches(organizationId),
    queryFn: () => organizationService.branchList(organizationId),
    enabled: Boolean(organizationId),
  });
}

export function useBranchesByOrganizations(organizationIds: readonly string[]) {
  return useQueries({
    queries: organizationIds.map((organizationId) => ({
      queryKey: organizationQueryKeys.branches(organizationId),
      queryFn: () => organizationService.branchList(organizationId),
    })),
  });
}
