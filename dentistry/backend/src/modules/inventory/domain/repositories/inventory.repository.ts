import type { InventoryItem } from '../entities/inventory-item.entity.js';
import type {
  InventoryMovement,
  InventoryMovementType,
} from '../entities/inventory-movement.entity.js';

export interface FindInventoryItemsFilters {
  organizationId: string;
  authorizedBranchIds: string[];
  branchId?: string;
  search?: string;
  status?: 'all' | 'out' | 'low';
  includeInactive?: boolean;
}

export interface RegisterInventoryMovementData {
  organizationId: string;
  authorizedBranchIds: string[];
  itemId: string;
  type: InventoryMovementType;
  quantity: number;
  unitCostMinor?: number | null;
  currency?: string;
  lotNumber?: string | null;
  expiryDate?: string | null;
  reason?: string | null;
  relatedTreatmentId?: string | null;
  relatedClinicalEncounterId?: string | null;
  createdByMembershipId: string;
}

export interface RegisterInventoryMovementResult {
  item: InventoryItem;
  movement: InventoryMovement;
}

export abstract class InventoryRepository {
  abstract findItems(
    filters: FindInventoryItemsFilters,
  ): Promise<InventoryItem[]>;

  abstract findItemById(
    id: string,
    organizationId: string,
  ): Promise<InventoryItem | null>;

  abstract findBySku(
    organizationId: string,
    branchId: string,
    sku: string,
  ): Promise<InventoryItem | null>;

  abstract createItem(item: InventoryItem): Promise<InventoryItem>;

  abstract updateItem(
    item: InventoryItem,
  ): Promise<InventoryItem | null>;

  abstract softDeleteItem(
    id: string,
    organizationId: string,
    deletedByMembershipId: string,
  ): Promise<InventoryItem | null>;

  abstract findMovements(
    itemId: string,
    organizationId: string,
  ): Promise<InventoryMovement[]>;

  abstract registerMovement(
    data: RegisterInventoryMovementData,
  ): Promise<RegisterInventoryMovementResult>;
}
