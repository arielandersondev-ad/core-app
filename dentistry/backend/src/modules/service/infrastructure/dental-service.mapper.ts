import { DentalService } from '../domain/entities/dental-service.entity.js';
import { DentalServiceSupply } from '../domain/entities/dental-service-supply.entity.js';

export interface DentalServiceSupplyRow {
  id: string;
  organizationId: string;
  serviceId: string;
  inventoryItemId: string | null;
  name: string;
  quantity: number;
  unit: string;
  estimatedCostMinor: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DentalServiceRow {
  id: string;
  organizationId: string;
  code: string | null;
  name: string;
  category: string | null;
  description: string | null;
  durationMinutes: number | null;
  basePriceMinor: number | null;
  labCostMinor: number | null;
  currency: string | null;
  active: boolean;
  createdByMembershipId: string;
  updatedByMembershipId: string | null;
  createdAt: Date;
  updatedAt: Date;
  supplies?: DentalServiceSupplyRow[];
}

export function toDentalServiceSupplyEntity(
  row: DentalServiceSupplyRow,
): DentalServiceSupply {
  return new DentalServiceSupply({
    id: row.id,
    organizationId: row.organizationId,
    serviceId: row.serviceId,
    inventoryItemId: row.inventoryItemId,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    estimatedCostMinor: row.estimatedCostMinor,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toDentalServiceEntity(row: DentalServiceRow): DentalService {
  return new DentalService({
    id: row.id,
    organizationId: row.organizationId,
    code: row.code,
    name: row.name,
    category: row.category,
    description: row.description,
    durationMinutes: row.durationMinutes,
    basePriceMinor: row.basePriceMinor,
    labCostMinor: row.labCostMinor,
    currency: row.currency,
    active: row.active,
    createdByMembershipId: row.createdByMembershipId,
    updatedByMembershipId: row.updatedByMembershipId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    supplies: row.supplies ? row.supplies.map(toDentalServiceSupplyEntity) : [],
  });
}
