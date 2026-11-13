import {
  InventoryItem,
} from '../domain/entities/inventory-item.entity.js';
import {
  InventoryMovement,
  type InventoryMovementType,
} from '../domain/entities/inventory-movement.entity.js';

export interface InventoryItemRow {
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
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  rowVersion: number;
}

export interface InventoryMovementRow {
  id: string;
  organizationId: string;
  branchId: string;
  itemId: string;
  type: string;
  quantity: number;
  unitCostMinor: number | null;
  currency: string;
  lotNumber: string | null;
  expiryDate: Date | string | null;
  reason: string | null;
  relatedTreatmentId: string | null;
  relatedClinicalEncounterId: string | null;
  createdByMembershipId: string;
  createdAt: Date;
}

export function toCivilDate(
  value: Date | string | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export function toInventoryItemEntity(
  row: InventoryItemRow,
): InventoryItem {
  return new InventoryItem({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    sku: row.sku,
    name: row.name,
    description: row.description,
    category: row.category,
    unit: row.unit,
    minStock: row.minStock,
    currentStock: row.currentStock,
    unitCostMinor: row.unitCostMinor,
    currency: row.currency,
    isActive: row.isActive,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    deletedAt: row.deletedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rowVersion: row.rowVersion,
  });
}

export function toInventoryMovementEntity(
  row: InventoryMovementRow,
): InventoryMovement {
  return new InventoryMovement({
    id: row.id,
    organizationId: row.organizationId,
    branchId: row.branchId,
    itemId: row.itemId,
    type: row.type as InventoryMovementType,
    quantity: row.quantity,
    unitCostMinor: row.unitCostMinor,
    currency: row.currency,
    lotNumber: row.lotNumber,
    expiryDate: toCivilDate(row.expiryDate),
    reason: row.reason,
    relatedTreatmentId: row.relatedTreatmentId,
    relatedClinicalEncounterId: row.relatedClinicalEncounterId,
    createdByMembershipId: row.createdByMembershipId,
    createdAt: row.createdAt,
  });
}
