const COLLECTION = "/api/dentistry/inventory/items";

export const INVENTORY_ENDPOINTS = {
  collection: COLLECTION,
  byId: (id: string) => `${COLLECTION}/${encodeURIComponent(id)}`,
  movements: (id: string) =>
    `${COLLECTION}/${encodeURIComponent(id)}/movements`,
} as const;
