import { INVENTORY_ENDPOINTS } from "@/features/inventory/api/endpoints";
import type {
  CreateInventoryItemRequest,
  InventoryItemDto,
  InventoryMovementDto,
  ListInventoryItemsParams,
  RegisterInventoryMovementRequest,
  RegisterInventoryMovementResult,
  UpdateInventoryItemRequest,
} from "@/features/inventory/types/inventory";
import { requestJson } from "@/infrastructure/http/request-json";

export function fetchInventoryItems(
  params: ListInventoryItemsParams = {},
  signal?: AbortSignal,
): Promise<InventoryItemDto[]> {
  const query = new URLSearchParams();
  if (params.branchId) query.set("branchId", params.branchId);
  if (params.search) query.set("search", params.search);
  if (params.status && params.status !== "all") {
    query.set("status", params.status);
  }
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson(`${INVENTORY_ENDPOINTS.collection}${suffix}`, {
    signal,
  });
}

export function createInventoryItem(
  payload: CreateInventoryItemRequest,
): Promise<InventoryItemDto> {
  return requestJson(INVENTORY_ENDPOINTS.collection, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateInventoryItem(
  id: string,
  payload: UpdateInventoryItemRequest,
): Promise<InventoryItemDto> {
  return requestJson(INVENTORY_ENDPOINTS.byId(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteInventoryItem(id: string): Promise<InventoryItemDto> {
  return requestJson(INVENTORY_ENDPOINTS.byId(id), {
    method: "DELETE",
  });
}

export function fetchInventoryMovements(
  itemId: string,
  signal?: AbortSignal,
): Promise<InventoryMovementDto[]> {
  return requestJson(INVENTORY_ENDPOINTS.movements(itemId), {
    signal,
  });
}

export function registerInventoryMovement(
  itemId: string,
  payload: RegisterInventoryMovementRequest,
): Promise<RegisterInventoryMovementResult> {
  return requestJson(INVENTORY_ENDPOINTS.movements(itemId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
