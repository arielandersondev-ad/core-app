export type InventoryStockStatus = 'OUT_OF_STOCK' | 'LOW' | 'OK';

export type InventoryMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryItemDto {
  id: string;
  organizationId: string;
  branchId: string;
  sku: string;
  name: string;
  description: string | null;
  category: string | null;
  unit: string;
  minStock: number;
  currentStock: number;
  unitCostMinor: number | null;
  currency: string;
  isActive: boolean;
  status: InventoryStockStatus;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
}

export interface InventoryMovementDto {
  id: string;
  organizationId: string;
  branchId: string;
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  signedQuantity: number;
  unitCostMinor: number | null;
  currency: string;
  lotNumber: string | null;
  expiryDate: string | null;
  reason: string | null;
  relatedTreatmentId: string | null;
  relatedClinicalEncounterId: string | null;
  createdByMembershipId: string;
  createdAt: string;
}

export interface ListInventoryItemsParams {
  branchId?: string;
  search?: string;
  status?: 'all' | 'out' | 'low';
}

export interface CreateInventoryItemRequest {
  branchId?: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  minStock?: number;
  currentStock?: number;
  unitCostMinor?: number;
  currency?: string;
}

export interface UpdateInventoryItemRequest {
  sku?: string;
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  minStock?: number;
  unitCostMinor?: number;
  currency?: string;
  isActive?: boolean;
}

export interface RegisterInventoryMovementRequest {
  type: InventoryMovementType;
  quantity: number;
  unitCostMinor?: number;
  currency?: string;
  lotNumber?: string;
  expiryDate?: string;
  reason?: string;
  relatedTreatmentId?: string;
  relatedClinicalEncounterId?: string;
}

export interface RegisterInventoryMovementResult {
  item: InventoryItemDto;
  movement: InventoryMovementDto;
}
