"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchDentalServices,
  fetchDentalServicesPaginated,
  fetchDentalServiceById,
  createDentalService,
  updateDentalService,
  toggleDentalServiceStatus,
  deleteDentalService,
  type DentalServiceDto,
  type ListDentalServicesParams,
  type PaginatedDentalServicesResponse,
  type CreateDentalServiceRequest,
  type UpdateDentalServiceRequest,
} from "../api/services";

export const dentalServiceQueryKeys = {
  all: ["dental-services"] as const,
  list: (params: ListDentalServicesParams = {}) => ["dental-services", "list", params] as const,
  paginated: (params: ListDentalServicesParams = {}) => ["dental-services", "paginated", params] as const,
  detail: (id: string, organizationId?: string) => ["dental-services", "detail", id, organizationId] as const,
};

export function useDentalServices(params: ListDentalServicesParams = {}) {
  return useQuery<DentalServiceDto[]>({
    queryKey: dentalServiceQueryKeys.list(params),
    queryFn: () => fetchDentalServices(params),
  });
}

export function useDentalServicesPaginated(params: ListDentalServicesParams = {}) {
  return useQuery<PaginatedDentalServicesResponse>({
    queryKey: dentalServiceQueryKeys.paginated(params),
    queryFn: () => fetchDentalServicesPaginated(params),
  });
}

export function useDentalServiceDetail(id: string, organizationId?: string) {
  return useQuery<DentalServiceDto>({
    queryKey: dentalServiceQueryKeys.detail(id, organizationId),
    queryFn: () => fetchDentalServiceById(id, organizationId),
    enabled: Boolean(id),
  });
}

export function useCreateDentalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDentalServiceRequest) => createDentalService(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dentalServiceQueryKeys.all,
      });
    },
  });
}

export function useUpdateDentalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDentalServiceRequest }) =>
      updateDentalService(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dentalServiceQueryKeys.all,
      });
    },
  });
}

export function useToggleDentalServiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { organizationId: string; updatedByMembershipId: string };
    }) => toggleDentalServiceStatus(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dentalServiceQueryKeys.all,
      });
    },
  });
}

export function useDeleteDentalService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, organizationId }: { id: string; organizationId?: string }) =>
      deleteDentalService(id, organizationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: dentalServiceQueryKeys.all,
      });
    },
  });
}
