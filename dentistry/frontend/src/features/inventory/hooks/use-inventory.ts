"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  fetchInventoryMovements,
  registerInventoryMovement,
  updateInventoryItem,
} from "@/features/inventory/services/inventory.service";
import type {
  CreateInventoryItemRequest,
  ListInventoryItemsParams,
  RegisterInventoryMovementRequest,
  UpdateInventoryItemRequest,
} from "@/features/inventory/types/inventory";

export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  items: (params: ListInventoryItemsParams) =>
    ["inventory", "items", params] as const,
  movements: (itemId: string) =>
    ["inventory", "movements", itemId] as const,
};

export function useInventoryItems(
  params: ListInventoryItemsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.items(params),
    queryFn: ({ signal }) => fetchInventoryItems(params, signal),
    enabled,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useInventoryMovements(
  itemId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: inventoryQueryKeys.movements(itemId ?? ""),
    queryFn: ({ signal }) =>
      fetchInventoryMovements(itemId as string, signal),
    enabled: Boolean(itemId) && enabled,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: inventoryQueryKeys.all,
    });
  };

  const create = useMutation({
    mutationFn: (payload: CreateInventoryItemRequest) =>
      createInventoryItem(payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInventoryItemRequest;
    }) => updateInventoryItem(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteInventoryItem(id),
    onSuccess: invalidate,
  });

  const move = useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: RegisterInventoryMovementRequest;
    }) => registerInventoryMovement(itemId, payload),
    onSuccess: invalidate,
  });

  return { create, update, remove, move };
}
